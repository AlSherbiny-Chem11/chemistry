// ============================================
//  نظام الإشعارات — notifications.js
//  Salman El-Shorbagy Academy
// ============================================

let _notifUnsubscribe    = null;
let _allNotifications    = [];
let _unreadCount         = 0;
let _notifCurrentTarget  = 'all';
let _notifPanelOpen      = false;
let _editNotifCurrentTarget = 'all'; // للاستخدام داخل Swal التعديل

// ============================================
//  تهيئة نظام الإشعارات — يُستدعى بعد تسجيل الدخول
// ============================================
function initNotifications() {
    const user = auth.currentUser;
    if (!user) return;

    const userEmail = user.email.toLowerCase();

    if (_notifUnsubscribe) {
        _notifUnsubscribe();
        _notifUnsubscribe = null;
    }

    _notifUnsubscribe = db.collection('notifications')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .onSnapshot(snap => {
            const now = new Date();
            _allNotifications = [];
            const toDeleteIds = []; // إشعارات منتهية الصلاحية — تُحذف من Firestore

            snap.forEach(doc => {
                const data = { id: doc.id, ...doc.data() };

                // تجاهل الإشعارات غير المفعّلة
                if (!data.active) return;

                // تحقق من انتهاء الصلاحية
                if (data.expiresAt && data.expiresAt.toDate && data.expiresAt.toDate() < now) {
                    // نضيفها لقائمة الحذف (يتم الحذف الفعلي من Firestore بواسطة المطور)
                    toDeleteIds.push(doc.id);
                    return;
                }

                // تحقق هل المستخدم يجب أن يرى هذا الإشعار
                if (!_isNotifVisibleToUser(data, userEmail)) return;

                // autoExpire: يختفي بعد قراءة المستخدم له
                if (data.autoExpire && (data.readBy || []).includes(userEmail)) return;

                _allNotifications.push(data);
            });

            // ── حذف الإشعارات المنتهية من Firestore (أي مستخدم يتولى التنظيف) ──
            if (toDeleteIds.length > 0) {
                toDeleteIds.forEach(id => {
                    db.collection('notifications').doc(id).delete().catch(() => {});
                });
            }

            // حساب غير المقروء
            _unreadCount = _allNotifications.filter(n =>
                !(n.readBy || []).includes(userEmail)
            ).length;

            // تحديث Badge الجرس
            _updateNotifBadge(_unreadCount);

            // إعادة رسم اللوحة لو كانت مفتوحة
            if (_notifPanelOpen) _renderNotificationsPanel();

        }, err => {
            console.warn('[Notifications] Listener error:', err);
        });
}

// ============================================
//  هل يجب أن يرى المستخدم هذا الإشعار؟
// ============================================
function _isNotifVisibleToUser(notif, userEmail) {
    if (!notif.targetType) return false;

    // المطور يرى كل الإشعارات دائماً
    if (currentUserRole === 'master') return true;

    if (notif.targetType === 'all') return true;

    if (notif.targetType === 'sections') {
        const targetSections = notif.targetSections || [];
        return currentUserAllowedGrades.some(g => targetSections.includes(g));
    }

    if (notif.targetType === 'users') {
        return (notif.targetUsers || []).includes(userEmail);
    }

    return false;
}

// ============================================
//  تحديث Badge الجرس
// ============================================
function _updateNotifBadge(count) {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : String(count);
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// ============================================
//  فتح / إغلاق لوحة الإشعارات
// ============================================
function openNotificationsPanel() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    _notifPanelOpen = true;
    panel.style.display = 'flex';
    lockBodyScroll();
    _renderNotificationsPanel();
    // ⚠️ لا نمييز كمقروء هنا — نمييز فقط عند الإغلاق
    // حتى يتمكن المستخدم من قراءة الإشعار قبل أن يختفي (autoExpire)
}

function closeNotificationsPanel() {
    const panel = document.getElementById('notifications-panel');
    if (!panel) return;

    // ✅ تمييز الكل كمقروء عند الإغلاق — للمشتركين فقط
    const user = auth.currentUser;
    if (user && currentUserRole !== 'master') {
        _markAllVisibleRead(user.email.toLowerCase());
    }

    _notifPanelOpen = false;
    panel.style.display = 'none';
    unlockBodyScroll();
}

// ============================================
//  رسم لوحة الإشعارات
// ============================================
function _renderNotificationsPanel() {
    const user = auth.currentUser;
    if (!user) return;

    const userEmail  = user.email.toLowerCase();
    const isMaster   = currentUserRole === 'master';
    const panelBody  = document.getElementById('notif-panel-body');
    if (!panelBody) return;

    // تحديث counter في الرأس
    const countEl = document.getElementById('notif-panel-count');
    if (countEl) {
        countEl.textContent = _unreadCount > 0
            ? `${_unreadCount} غير مقروء`
            : 'لا يوجد جديد';
    }

    let html = '';

    // نموذج إنشاء إشعار — للمطور فقط
    if (isMaster) {
        html += _buildMasterCreateForm();
    }

    // قائمة الإشعارات
    html += `<div id="notif-list-container" style="padding:8px 14px 14px;">`;

    if (_allNotifications.length === 0) {
        html += `
        <div style="text-align:center;padding:36px 20px;">
            <div style="width:54px;height:54px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
                <i class="fas fa-bell-slash" style="font-size:20px;color:rgba(255,255,255,0.18);"></i>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-family:'Cairo',sans-serif;font-size:13px;font-weight:700;margin:0;">لا توجد إشعارات حالياً</p>
        </div>`;
    } else {
        _allNotifications.forEach((n, idx) => {
            const isRead   = (n.readBy || []).includes(userEmail);
            const timeStr  = n.createdAt?.toDate ? formatTimeAgo(n.createdAt.toDate()) : '';
            const badge    = _buildTargetBadge(n);
            const delay    = Math.min(idx * 0.04, 0.3);

            // معلومات المشاهدة للمطور
            const readCount = (n.readBy || []).length;

            html += `
            <div class="notif-item" data-id="${n.id}"
                style="background:${isRead ? 'rgba(255,255,255,0.02)' : 'rgba(197,160,89,0.06)'};
                       border:1px solid ${isRead ? 'rgba(255,255,255,0.05)' : 'rgba(197,160,89,0.15)'};
                       border-radius:14px;padding:12px 14px;margin-bottom:8px;cursor:pointer;
                       transition:all 0.2s;position:relative;
                       animation:notifItemIn 0.3s ease ${delay}s both;"
                onclick="_handleNotifClick('${n.id}')">

                ${!isRead ? `<div style="position:absolute;top:12px;left:14px;width:7px;height:7px;border-radius:50%;background:#c5a059;box-shadow:0 0 8px rgba(197,160,89,0.7);"></div>` : ''}

                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <div style="width:36px;height:36px;background:rgba(197,160,89,0.1);border:1px solid rgba(197,160,89,0.15);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
                        <i class="${n.isAuto ? 'fas fa-film' : 'fas fa-bell'}" style="color:#c5a059;font-size:13px;"></i>
                    </div>
                    <div style="flex:1;min-width:0;">
                        <p style="color:${isRead ? 'rgba(255,255,255,0.7)' : 'white'};font-family:'Cairo',sans-serif;font-size:12px;font-weight:900;margin:0 0 4px;line-height:1.4;">${n.title}</p>
                        <p style="color:rgba(255,255,255,0.45);font-family:'Cairo',sans-serif;font-size:11px;line-height:1.5;margin:0 0 6px;">${n.body}</p>
                        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                            ${timeStr ? `<span style="color:rgba(255,255,255,0.2);font-size:9px;font-family:'Cairo',sans-serif;">${timeStr}</span>` : ''}
                            ${badge}
                            ${n.autoExpire ? `<span style="background:rgba(251,191,36,0.1);color:#fbbf24;font-family:'Cairo',sans-serif;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;">👁️ يختفي بعد القراءة</span>` : ''}
                            ${n.expiresAt ? `<span style="background:rgba(156,163,175,0.1);color:#9ca3af;font-family:'Cairo',sans-serif;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;">⏱️ مؤقت</span>` : ''}
                        </div>
                    </div>
                </div>

                ${isMaster ? `
                <div style="display:flex;gap:6px;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.05);">
                    <button onclick="event.stopPropagation();showNotifViewers('${n.id}')"
                        style="flex:1;padding:5px 10px;background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.2);border-radius:8px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;"
                        onmouseover="this.style.background='rgba(52,211,153,0.25)'"
                        onmouseout="this.style.background='rgba(52,211,153,0.1)'">
                        <i class="fas fa-eye"></i> من شاف؟ (${readCount})
                    </button>
                    <button onclick="event.stopPropagation();editNotification('${n.id}')"
                        style="flex:1;padding:5px 10px;background:rgba(59,130,246,0.15);color:#60a5fa;border:1px solid rgba(59,130,246,0.25);border-radius:8px;font-size:10px;font-weight:700;cursor:pointer;font-family:'Cairo',sans-serif;transition:all 0.2s;"
                        onmouseover="this.style.background='rgba(59,130,246,0.35)'"
                        onmouseout="this.style.background='rgba(59,130,246,0.15)'">
                        <i class="fas fa-pen"></i> تعديل
                    </button>
                    <button onclick="event.stopPropagation();deleteNotification('${n.id}')"
                        style="width:32px;height:32px;background:rgba(239,68,68,0.1);color:#ef4444;border:1px solid rgba(239,68,68,0.2);border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all 0.2s;flex-shrink:0;"
                        onmouseover="this.style.background='rgba(239,68,68,0.35)'"
                        onmouseout="this.style.background='rgba(239,68,68,0.1)'">
                        <i class="fas fa-trash-alt" style="font-size:10px;"></i>
                    </button>
                </div>` : ''}
            </div>`;
        });
    }

    html += `</div>`;
    panelBody.innerHTML = html;
}

// ============================================
//  Badge لنوع الاستهداف
// ============================================
function _buildTargetBadge(n) {
    const map = {
        'all':      { label: 'للجميع',               color: '#60a5fa', bg: 'rgba(59,130,246,0.12)'   },
        'sections': { label: 'لأقسام محددة',          color: '#34d399', bg: 'rgba(52,211,153,0.12)'   },
        'users':    { label: 'لمستخدمين محددين',      color: '#a78bfa', bg: 'rgba(167,139,250,0.12)'  },
    };
    const info = map[n.targetType] || { label: n.targetType, color: '#c5a059', bg: 'rgba(197,160,89,0.12)' };
    return `<span style="background:${info.bg};color:${info.color};font-family:'Cairo',sans-serif;font-size:8px;font-weight:700;padding:2px 8px;border-radius:20px;">${info.label}</span>`;
}

// ============================================
//  بناء نموذج إنشاء الإشعار — للمطور
// ============================================
function _buildMasterCreateForm() {
    const sectionsOpts = allSections.map(s =>
        `<label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:5px 8px;border-radius:8px;transition:background 0.15s;"
            onmouseover="this.style.background='rgba(255,255,255,0.04)'"
            onmouseout="this.style.background='transparent'">
            <input type="checkbox" class="notif-section-check" value="${s.id}"
                style="accent-color:#c5a059;width:14px;height:14px;cursor:pointer;flex-shrink:0;">
            <span style="color:rgba(255,255,255,0.7);font-family:'Cairo',sans-serif;font-size:11px;font-weight:700;">${s.name}</span>
        </label>`
    ).join('');

    let usersOpts = '';
    usersDataMap.forEach((data, email) => {
        if (data.role === 'master') return;
        const name = data.displayName || data.googleName || email;
        usersOpts += `
        <label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:5px 8px;border-radius:8px;transition:background 0.15s;"
            onmouseover="this.style.background='rgba(255,255,255,0.04)'"
            onmouseout="this.style.background='transparent'">
            <input type="checkbox" class="notif-user-check" value="${email}"
                style="accent-color:#c5a059;width:14px;height:14px;cursor:pointer;flex-shrink:0;">
            <span style="color:rgba(255,255,255,0.7);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
            <span style="color:rgba(255,255,255,0.2);font-family:monospace;font-size:8px;flex-shrink:0;">${email.split('@')[0]}</span>
        </label>`;
    });
    if (!usersOpts) usersOpts = `<p style="color:rgba(255,255,255,0.2);font-size:10px;text-align:center;padding:10px;font-family:'Cairo',sans-serif;">لا يوجد مشتركون</p>`;

    return `
    <div style="padding:14px 14px 0;">
        <div style="background:rgba(0,0,0,0.35);border:1px solid rgba(197,160,89,0.12);border-radius:16px;padding:14px;margin-bottom:10px;">

            <!-- رأس النموذج -->
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
                <div style="width:28px;height:28px;background:rgba(197,160,89,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fas fa-paper-plane" style="color:#c5a059;font-size:11px;"></i>
                </div>
                <p style="color:#c5a059;font-family:'Cairo',sans-serif;font-weight:900;font-size:13px;margin:0;">إنشاء إشعار جديد</p>
            </div>

            <!-- عنوان الإشعار -->
            <input type="text" id="notif-title-input" placeholder="عنوان الإشعار..."
                style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:12px;padding:9px 12px;outline:none;margin-bottom:8px;transition:border-color 0.2s;"
                onfocus="this.style.borderColor='rgba(197,160,89,0.5)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)'">

            <!-- محتوى الإشعار -->
            <textarea id="notif-body-input" placeholder="محتوى الإشعار..." rows="2"
                style="width:100%;box-sizing:border-box;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:12px;padding:9px 12px;outline:none;margin-bottom:10px;resize:vertical;transition:border-color 0.2s;min-height:60px;"
                onfocus="this.style.borderColor='rgba(197,160,89,0.5)'"
                onblur="this.style.borderColor='rgba(255,255,255,0.1)'"></textarea>

            <!-- نوع الاستهداف -->
            <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0 0 7px;">استهداف الإشعار:</p>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
                <button class="notif-target-btn" data-target="all" onclick="switchNotifTarget('all')"
                    style="padding:5px 13px;border-radius:20px;border:1px solid rgba(197,160,89,0.35);background:rgba(197,160,89,0.2);color:#c5a059;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    🌍 للجميع
                </button>
                <button class="notif-target-btn" data-target="sections" onclick="switchNotifTarget('sections')"
                    style="padding:5px 13px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    🗂️ أقسام
                </button>
                <button class="notif-target-btn" data-target="users" onclick="switchNotifTarget('users')"
                    style="padding:5px 13px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.5);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all 0.2s;">
                    👥 أشخاص
                </button>
            </div>

            <!-- اختيار الأقسام -->
            <div id="notif-sections-container" style="display:none;margin-bottom:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                    <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0;">الأقسام:</p>
                    <button onclick="toggleAllNotifSections()" style="color:#c5a059;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;background:none;border:none;cursor:pointer;padding:0;">تحديد الكل</button>
                </div>
                <div style="display:flex;flex-direction:column;gap:2px;">${sectionsOpts}</div>
            </div>

            <!-- اختيار الأشخاص -->
            <div id="notif-users-container" style="display:none;margin-bottom:10px;">
                <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0;">المشتركون:</p>
                        <button onclick="toggleAllNotifUsers()" style="color:#c5a059;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;background:none;border:none;cursor:pointer;padding:0;">تحديد الكل</button>
                    </div>
                    <div id="notif-users-list" style="display:flex;flex-direction:column;gap:2px;max-height:130px;overflow-y:auto;">${usersOpts}</div>
                </div>
            </div>

            <!-- مدة الإشعار -->
            <div style="margin-bottom:12px;">
                <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0 0 6px;">مدة الإشعار:</p>
                <select id="notif-duration-select"
                    style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:11px;padding:8px 12px;outline:none;cursor:pointer;transition:border-color 0.2s;"
                    onfocus="this.style.borderColor='rgba(197,160,89,0.5)'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.1)'">
                    <option value="permanent" style="background:#0d1117;color:white;">♾️ دائم</option>
                    <option value="24h" style="background:#0d1117;color:white;">⏱️ 24 ساعة</option>
                    <option value="48h" style="background:#0d1117;color:white;">⏱️ 48 ساعة</option>
                    <option value="30d" style="background:#0d1117;color:white;">📅 30 يوم</option>
                    <option value="read" style="background:#0d1117;color:white;">👁️ يختفي بعد القراءة</option>
                </select>
            </div>

            <!-- زرار الإرسال -->
            <button onclick="sendNotification()"
                style="width:100%;padding:10px;background:linear-gradient(135deg,#c5a059,#a8833e);color:#080c14;border:none;border-radius:10px;font-family:'Cairo',sans-serif;font-size:12px;font-weight:900;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:7px;"
                onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 6px 20px rgba(197,160,89,0.3)'"
                onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='none'">
                <i class="fas fa-paper-plane"></i> إرسال الإشعار
            </button>
        </div>
    </div>`;
}

// ============================================
//  تبديل نوع الاستهداف (نموذج الإنشاء)
// ============================================
function switchNotifTarget(target) {
    _notifCurrentTarget = target;

    document.querySelectorAll('.notif-target-btn').forEach(btn => {
        const isActive = btn.dataset.target === target;
        btn.style.background    = isActive ? 'rgba(197,160,89,0.2)'   : 'rgba(255,255,255,0.05)';
        btn.style.color         = isActive ? '#c5a059'                 : 'rgba(255,255,255,0.5)';
        btn.style.borderColor   = isActive ? 'rgba(197,160,89,0.35)'  : 'rgba(255,255,255,0.1)';
    });

    const sec = document.getElementById('notif-sections-container');
    const usr = document.getElementById('notif-users-container');
    if (sec) sec.style.display = target === 'sections' ? 'block' : 'none';
    if (usr) usr.style.display = target === 'users'    ? 'block' : 'none';
}

// ============================================
//  تبديل نوع الاستهداف (نموذج التعديل داخل Swal)
// ============================================
function switchEditNotifTarget(target) {
    _editNotifCurrentTarget = target;

    document.querySelectorAll('.edit-notif-target-btn').forEach(btn => {
        const isActive = btn.dataset.target === target;
        btn.style.background  = isActive ? 'rgba(197,160,89,0.2)'   : 'rgba(255,255,255,0.05)';
        btn.style.color       = isActive ? '#c5a059'                 : 'rgba(255,255,255,0.5)';
        btn.style.borderColor = isActive ? 'rgba(197,160,89,0.35)'  : 'rgba(255,255,255,0.1)';
    });

    const sec = document.getElementById('edit-notif-sections-container');
    const usr = document.getElementById('edit-notif-users-container');
    if (sec) sec.style.display = target === 'sections' ? 'block' : 'none';
    if (usr) usr.style.display = target === 'users'    ? 'block' : 'none';
}

function toggleAllNotifSections() {
    const checks = document.querySelectorAll('.notif-section-check');
    const allOn  = Array.from(checks).every(c => c.checked);
    checks.forEach(c => c.checked = !allOn);
}

function toggleAllNotifUsers() {
    const checks = document.querySelectorAll('.notif-user-check');
    const allOn  = Array.from(checks).every(c => c.checked);
    checks.forEach(c => c.checked = !allOn);
}

// ============================================
//  إرسال إشعار
// ============================================
async function sendNotification() {
    const user = auth.currentUser;
    if (!user || currentUserRole !== 'master') return;

    const title = document.getElementById('notif-title-input')?.value.trim();
    const body  = document.getElementById('notif-body-input')?.value.trim();

    if (!title) { showToast('اكتب عنوان الإشعار أولاً!', 'warning'); return; }
    if (!body)  { showToast('اكتب محتوى الإشعار أولاً!', 'warning'); return; }

    let targetSections = [];
    let targetUsers    = [];

    if (_notifCurrentTarget === 'sections') {
        targetSections = Array.from(document.querySelectorAll('.notif-section-check:checked')).map(c => c.value);
        if (targetSections.length === 0) { showToast('اختر قسماً واحداً على الأقل!', 'warning'); return; }
    }

    if (_notifCurrentTarget === 'users') {
        targetUsers = Array.from(document.querySelectorAll('.notif-user-check:checked')).map(c => c.value);
        if (targetUsers.length === 0) { showToast('اختر مستخدماً واحداً على الأقل!', 'warning'); return; }
    }

    // حساب وقت الانتهاء
    const durationVal = document.getElementById('notif-duration-select')?.value || 'permanent';
    let expiresAt  = null;
    let autoExpire = false;

    if (durationVal === '24h') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 3600 * 1000));
    } else if (durationVal === '48h') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 3600 * 1000));
    } else if (durationVal === '30d') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 3600 * 1000));
    } else if (durationVal === 'read') {
        autoExpire = true;
    }

    const notifData = {
        title,
        body,
        targetType:     _notifCurrentTarget,
        targetSections,
        targetUsers,
        createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
        createdBy:      user.email.toLowerCase(),
        expiresAt,
        autoExpire,
        readBy:         [],
        active:         true,
        isAuto:         false,
    };

    try {
        await db.collection('notifications').add(notifData);
        showToast('تم إرسال الإشعار ✅');

        // ── إعادة تعيين النموذج بدون إغلاق اللوحة ──
        _notifCurrentTarget = 'all';
        const titleInput = document.getElementById('notif-title-input');
        const bodyInput  = document.getElementById('notif-body-input');
        const durSelect  = document.getElementById('notif-duration-select');
        if (titleInput) titleInput.value = '';
        if (bodyInput)  bodyInput.value  = '';
        if (durSelect)  durSelect.value  = 'permanent';
        // إعادة رسم اللوحة (الـ listener سيحدّثها تلقائياً عبر Firebase)

    } catch (e) {
        console.error('[Notifications] send error:', e);
        showToast('حدث خطأ في الإرسال', 'error');
    }
}

// ============================================
//  تعديل إشعار — كامل (عنوان + محتوى + استهداف + مدة)
// ============================================
async function editNotification(notifId) {
    if (currentUserRole !== 'master') return;

    const notif = _allNotifications.find(n => n.id === notifId);
    if (!notif) return;

    // تحديد المدة الحالية
    _editNotifCurrentTarget = notif.targetType || 'all';
    let currentDuration = 'permanent';
    if (notif.autoExpire) {
        currentDuration = 'read';
    } else if (notif.expiresAt && notif.expiresAt.toDate) {
        const expiresDate = notif.expiresAt.toDate();
        const createdDate = notif.createdAt?.toDate?.() || new Date();
        const diffHours   = (expiresDate - createdDate) / 3600000;
        if (diffHours <= 26)      currentDuration = '24h';
        else if (diffHours <= 50) currentDuration = '48h';
        else                      currentDuration = '30d';
    }

    // بناء checkboxes الأقسام
    const sectionsHtml = allSections.map(s => {
        const checked = (notif.targetSections || []).includes(s.id) ? 'checked' : '';
        return `<label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:5px 8px;border-radius:8px;">
            <input type="checkbox" class="edit-notif-section-check" value="${s.id}" ${checked}
                style="accent-color:#c5a059;width:14px;height:14px;cursor:pointer;flex-shrink:0;">
            <span style="color:rgba(255,255,255,0.7);font-family:'Cairo',sans-serif;font-size:11px;font-weight:700;">${s.name}</span>
        </label>`;
    }).join('');

    // بناء checkboxes المستخدمين
    let usersHtml = '';
    usersDataMap.forEach((data, email) => {
        if (data.role === 'master') return;
        const name    = data.displayName || data.googleName || email;
        const checked = (notif.targetUsers || []).includes(email) ? 'checked' : '';
        usersHtml += `<label style="display:flex;align-items:center;gap:7px;cursor:pointer;padding:5px 8px;border-radius:8px;">
            <input type="checkbox" class="edit-notif-user-check" value="${email}" ${checked}
                style="accent-color:#c5a059;width:14px;height:14px;cursor:pointer;flex-shrink:0;">
            <span style="color:rgba(255,255,255,0.7);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
            <span style="color:rgba(255,255,255,0.2);font-family:monospace;font-size:8px;flex-shrink:0;">${email.split('@')[0]}</span>
        </label>`;
    });
    if (!usersHtml) usersHtml = `<p style="color:rgba(255,255,255,0.2);font-size:10px;text-align:center;padding:10px;font-family:'Cairo',sans-serif;">لا يوجد مشتركون</p>`;

    // بناء أزرار الاستهداف
    const targetDefs = [
        { val: 'all',      label: '🌍 للجميع'  },
        { val: 'sections', label: '🗂️ أقسام'   },
        { val: 'users',    label: '👥 أشخاص'  },
    ];
    const targetBtnsHtml = targetDefs.map(t => {
        const isActive = t.val === _editNotifCurrentTarget;
        return `<button type="button" class="edit-notif-target-btn" data-target="${t.val}"
            onclick="switchEditNotifTarget('${t.val}')"
            style="padding:5px 13px;border-radius:20px;cursor:pointer;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;transition:all 0.2s;
                   border:1px solid ${isActive ? 'rgba(197,160,89,0.35)' : 'rgba(255,255,255,0.1)'};
                   background:${isActive ? 'rgba(197,160,89,0.2)' : 'rgba(255,255,255,0.05)'};
                   color:${isActive ? '#c5a059' : 'rgba(255,255,255,0.5)'};">
            ${t.label}
        </button>`;
    }).join('');

    const { value: formValues, isDismissed } = await Swal.fire({
        title: 'تعديل الإشعار',
        html: `
            <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;">

                <label style="display:block;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px;">عنوان الإشعار</label>
                <input id="edit-swal-title" type="text"
                    value="${(notif.title || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
                    style="width:100%;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none;margin-bottom:12px;"
                    onfocus="this.style.borderColor='rgba(197,160,89,0.6)'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.12)'">

                <label style="display:block;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px;">محتوى الإشعار</label>
                <textarea id="edit-swal-body" rows="3"
                    style="width:100%;box-sizing:border-box;padding:10px 14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:12px;outline:none;resize:vertical;direction:rtl;min-height:80px;margin-bottom:12px;"
                    onfocus="this.style.borderColor='rgba(197,160,89,0.6)'"
                    onblur="this.style.borderColor='rgba(255,255,255,0.12)'">${notif.body || ''}</textarea>

                <label style="display:block;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:7px;">استهداف الإشعار</label>
                <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
                    ${targetBtnsHtml}
                </div>

                <!-- أقسام -->
                <div id="edit-notif-sections-container"
                    style="display:${_editNotifCurrentTarget === 'sections' ? 'block' : 'none'};margin-bottom:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0;">الأقسام:</p>
                        <button type="button" onclick="document.querySelectorAll('.edit-notif-section-check').forEach(c=>c.checked=!Array.from(document.querySelectorAll('.edit-notif-section-check')).every(x=>x.checked))"
                            style="color:#c5a059;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;background:none;border:none;cursor:pointer;padding:0;">تحديد الكل</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:2px;max-height:140px;overflow-y:auto;">${sectionsHtml || '<p style="color:rgba(255,255,255,0.2);font-size:10px;text-align:center;padding:10px;font-family:Cairo,sans-serif;">لا توجد أقسام</p>'}</div>
                </div>

                <!-- مستخدمون -->
                <div id="edit-notif-users-container"
                    style="display:${_editNotifCurrentTarget === 'users' ? 'block' : 'none'};margin-bottom:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:10px;">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                        <p style="color:rgba(255,255,255,0.4);font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;margin:0;">المشتركون:</p>
                        <button type="button" onclick="document.querySelectorAll('.edit-notif-user-check').forEach(c=>c.checked=!Array.from(document.querySelectorAll('.edit-notif-user-check')).every(x=>x.checked))"
                            style="color:#c5a059;font-family:'Cairo',sans-serif;font-size:10px;font-weight:700;background:none;border:none;cursor:pointer;padding:0;">تحديد الكل</button>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:2px;max-height:140px;overflow-y:auto;">${usersHtml}</div>
                </div>

                <label style="display:block;font-size:11px;color:rgba(255,255,255,0.45);margin-bottom:6px;">مدة الإشعار</label>
                <select id="edit-swal-duration"
                    style="width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:white;font-family:'Cairo',sans-serif;font-size:11px;padding:8px 12px;outline:none;cursor:pointer;">
                    <option value="permanent" style="background:#111827;color:white;" ${currentDuration === 'permanent' ? 'selected' : ''}>♾️ دائم</option>
                    <option value="24h"       style="background:#111827;color:white;" ${currentDuration === '24h'       ? 'selected' : ''}>⏱️ 24 ساعة</option>
                    <option value="48h"       style="background:#111827;color:white;" ${currentDuration === '48h'       ? 'selected' : ''}>⏱️ 48 ساعة</option>
                    <option value="30d"       style="background:#111827;color:white;" ${currentDuration === '30d'       ? 'selected' : ''}>📅 30 يوم</option>
                    <option value="read"      style="background:#111827;color:white;" ${currentDuration === 'read'      ? 'selected' : ''}>👁️ يختفي بعد القراءة</option>
                </select>

                <p style="color:rgba(255,255,255,0.2);font-size:9px;font-family:'Cairo',sans-serif;margin:8px 0 0;text-align:center;">
                    ⚠️ تغيير المدة أو الاستهداف سيُعيد ضبط سجل القراءة
                </p>
            </div>
        `,
        showCancelButton:   true,
        confirmButtonText:  'حفظ التعديلات',
        cancelButtonText:   'إلغاء',
        confirmButtonColor: '#c5a059',
        cancelButtonColor:  '#6b7280',
        background: '#111827',
        color: '#fff',
        heightAuto: false,
        width: Math.min(window.innerWidth * 0.92, 500) + 'px',
        preConfirm: () => {
            const t = document.getElementById('edit-swal-title')?.value.trim();
            const b = document.getElementById('edit-swal-body')?.value.trim();
            if (!t) { Swal.showValidationMessage('اكتب عنواناً للإشعار!'); return false; }
            if (!b) { Swal.showValidationMessage('اكتب محتوى للإشعار!'); return false; }

            const targetType = _editNotifCurrentTarget;
            let targetSections = [];
            let targetUsers    = [];

            if (targetType === 'sections') {
                targetSections = Array.from(document.querySelectorAll('.edit-notif-section-check:checked')).map(c => c.value);
                if (!targetSections.length) { Swal.showValidationMessage('اختر قسماً واحداً على الأقل!'); return false; }
            }
            if (targetType === 'users') {
                targetUsers = Array.from(document.querySelectorAll('.edit-notif-user-check:checked')).map(c => c.value);
                if (!targetUsers.length) { Swal.showValidationMessage('اختر مستخدماً واحداً على الأقل!'); return false; }
            }

            const duration = document.getElementById('edit-swal-duration')?.value || 'permanent';
            return { title: t, body: b, targetType, targetSections, targetUsers, duration };
        }
    });

    if (isDismissed || !formValues) return;

    // حساب expiresAt الجديد
    let expiresAt  = null;
    let autoExpire = false;

    if (formValues.duration === '24h') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 24 * 3600 * 1000));
    } else if (formValues.duration === '48h') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 48 * 3600 * 1000));
    } else if (formValues.duration === '30d') {
        expiresAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 3600 * 1000));
    } else if (formValues.duration === 'read') {
        autoExpire = true;
    }

    // تحديد هل تغيّر الاستهداف أو المدة (لإعادة ضبط readBy)
    const targetChanged   = formValues.targetType !== notif.targetType
                         || JSON.stringify(formValues.targetSections) !== JSON.stringify(notif.targetSections || [])
                         || JSON.stringify(formValues.targetUsers)    !== JSON.stringify(notif.targetUsers    || []);
    const durationChanged = formValues.duration !== currentDuration;
    const shouldResetRead = targetChanged || durationChanged;

    const updatePayload = {
        title:          formValues.title,
        body:           formValues.body,
        targetType:     formValues.targetType,
        targetSections: formValues.targetSections,
        targetUsers:    formValues.targetUsers,
        expiresAt,
        autoExpire,
    };

    // إعادة ضبط readBy لو تغيّر الاستهداف أو المدة
    if (shouldResetRead) {
        updatePayload.readBy = [];
    }

    try {
        await db.collection('notifications').doc(notifId).update(updatePayload);
        showToast('تم تحديث الإشعار ✅');
    } catch (e) {
        console.error('[Notifications] edit error:', e);
        showToast('حدث خطأ في التحديث', 'error');
    }
}

// ============================================
//  حذف إشعار
// ============================================
async function deleteNotification(notifId) {
    if (currentUserRole !== 'master') return;

    const result = await Swal.fire({
        title: 'حذف الإشعار؟',
        text: 'سيُحذف الإشعار نهائياً من جميع المستخدمين',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'حذف',
        cancelButtonText:  'إلغاء',
        confirmButtonColor: '#ef4444',
        cancelButtonColor:  '#6b7280',
        background: '#111827', color: '#fff',
    });

    if (!result.isConfirmed) return;

    try {
        await db.collection('notifications').doc(notifId).delete();
        showToast('تم حذف الإشعار ✅');
    } catch (e) {
        showToast('حدث خطأ في الحذف', 'error');
    }
}

// ============================================
//  من شاف الإشعار؟ — للمطور فقط
// ============================================
async function showNotifViewers(notifId) {
    if (currentUserRole !== 'master') return;

    const notif = _allNotifications.find(n => n.id === notifId);
    if (!notif) return;

    const readSet = new Set(notif.readBy || []);

    // تحديد المستهدفين
    let targetEmails = [];
    if (notif.targetType === 'all') {
        usersDataMap.forEach((data, email) => {
            if (data.role !== 'master') targetEmails.push(email);
        });
    } else if (notif.targetType === 'sections') {
        const targetSec = new Set(notif.targetSections || []);
        usersDataMap.forEach((data, email) => {
            if (data.role === 'master') return;
            const grades = data.allowedGrades || [];
            if (grades.some(g => targetSec.has(g))) targetEmails.push(email);
        });
    } else if (notif.targetType === 'users') {
        targetEmails = notif.targetUsers || [];
    }

    const readers    = targetEmails.filter(e =>  readSet.has(e));
    const notReaders = targetEmails.filter(e => !readSet.has(e));

    const buildRow = (email, didRead) => {
        const data = usersDataMap.get(email) || {};
        const name = data.displayName || data.googleName || email;
        return `
        <div style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:4px;">
            <div style="width:7px;height:7px;border-radius:50%;flex-shrink:0;background:${didRead ? '#34d399' : '#ef4444'};box-shadow:0 0 6px ${didRead ? 'rgba(52,211,153,0.5)' : 'rgba(239,68,68,0.5)'};"></div>
            <span style="color:rgba(255,255,255,0.85);font-size:11px;font-weight:700;font-family:'Cairo',sans-serif;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${name}</span>
            <span style="color:rgba(255,255,255,0.2);font-size:9px;font-family:monospace;flex-shrink:0;">${email.split('@')[0]}</span>
        </div>`;
    };

    const total = targetEmails.length;
    const pct   = total > 0 ? Math.round((readers.length / total) * 100) : 0;

    let html = `<div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;">

        <!-- إحصائيات -->
        <div style="display:flex;gap:8px;margin-bottom:14px;">
            <div style="flex:1;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:12px;padding:12px;text-align:center;">
                <p style="color:#34d399;font-size:22px;font-weight:900;margin:0;">${readers.length}</p>
                <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:2px 0 0;">شافوا ✅</p>
            </div>
            <div style="flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:12px;padding:12px;text-align:center;">
                <p style="color:#ef4444;font-size:22px;font-weight:900;margin:0;">${notReaders.length}</p>
                <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:2px 0 0;">لم يشوفوا ❌</p>
            </div>
            <div style="flex:1;background:rgba(197,160,89,0.08);border:1px solid rgba(197,160,89,0.2);border-radius:12px;padding:12px;text-align:center;">
                <p style="color:#c5a059;font-size:22px;font-weight:900;margin:0;">${pct}%</p>
                <p style="color:rgba(255,255,255,0.4);font-size:10px;margin:2px 0 0;">نسبة القراءة</p>
            </div>
        </div>

        <!-- شريط التقدم -->
        <div style="background:rgba(255,255,255,0.07);border-radius:20px;height:6px;margin-bottom:16px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#34d399,#c5a059);border-radius:20px;transition:width 0.4s;"></div>
        </div>

        <div style="max-height:42vh;overflow-y:auto;">`;

    if (readers.length > 0) {
        html += `<p style="color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;margin:0 0 6px;">✅ قرأوا الإشعار (${readers.length}):</p>`;
        readers.forEach(e => { html += buildRow(e, true); });
    }

    if (notReaders.length > 0) {
        html += `<p style="color:rgba(255,255,255,0.35);font-size:10px;font-weight:700;margin:${readers.length > 0 ? '14px' : '0'} 0 6px;">❌ لم يقرؤوا بعد (${notReaders.length}):</p>`;
        notReaders.forEach(e => { html += buildRow(e, false); });
    }

    if (targetEmails.length === 0) {
        html += `<p style="color:rgba(255,255,255,0.2);font-size:12px;text-align:center;padding:20px;">لا يوجد مستخدمون مستهدفون</p>`;
    }

    html += `</div></div>`;

    await Swal.fire({
        title: '👁️ من شاف الإشعار؟',
        html,
        background: '#111827',
        color: '#fff',
        confirmButtonText:  'إغلاق',
        confirmButtonColor: '#c5a059',
        heightAuto: false,
        width: Math.min(window.innerWidth * 0.92, 480) + 'px',
    });
}

// ============================================
//  الضغط على إشعار — تمييزه مقروءاً + اختفاء فوري للـ autoExpire
// ============================================
async function _handleNotifClick(notifId) {
    const user = auth.currentUser;
    if (!user) return;
    const userEmail = user.email.toLowerCase();

    const notif = _allNotifications.find(n => n.id === notifId);
    if (!notif || (notif.readBy || []).includes(userEmail)) return;

    // Optimistic update فوري — اختفاء الإشعار من الواجهة على طول
    if (notif.autoExpire) {
        // إزالته من المصفوفة المحلية فوراً
        _allNotifications = _allNotifications.filter(n => n.id !== notifId);
        _unreadCount = Math.max(0, _unreadCount - 1);
        _updateNotifBadge(_unreadCount);
        if (_notifPanelOpen) _renderNotificationsPanel();
    }

    try {
        await db.collection('notifications').doc(notifId).update({
            readBy: firebase.firestore.FieldValue.arrayUnion(userEmail)
        });
    } catch (e) {
        console.warn('[Notifications] markRead error:', e);
    }
}

// ============================================
//  تمييز الكل كمقروء بعد فتح اللوحة
// ============================================
async function _markAllVisibleRead(userEmail) {
    const unread = _allNotifications.filter(n => !(n.readBy || []).includes(userEmail));
    if (unread.length === 0) return;

    // Optimistic update محلي — فوري قبل Firestore
    unread.forEach(n => {
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(userEmail)) n.readBy.push(userEmail);
    });

    // إزالة autoExpire notifications من المصفوفة المحلية فوراً
    _allNotifications = _allNotifications.filter(n => {
        if (n.autoExpire && (n.readBy || []).includes(userEmail)) return false;
        return true;
    });

    // إعادة حساب غير المقروء
    _unreadCount = _allNotifications.filter(n => !(n.readBy || []).includes(userEmail)).length;
    _updateNotifBadge(_unreadCount);

    // إعادة الرسم إذا اللوحة مفتوحة
    if (_notifPanelOpen) _renderNotificationsPanel();

    // Batch update Firestore
    const batch = db.batch();
    unread.forEach(n => {
        const ref = db.collection('notifications').doc(n.id);
        batch.update(ref, { readBy: firebase.firestore.FieldValue.arrayUnion(userEmail) });
    });

    try { await batch.commit(); } catch (e) {
        console.warn('[Notifications] markAllRead error:', e);
    }
}

// ============================================
//  إنشاء إشعار تلقائي عند رفع محتوى
// ============================================
async function createAutoNotification(title, grade, type) {
    const user = auth.currentUser;
    if (!user) return;

    const typeText    = type === 'image' ? 'مادة تعليمية جديدة' : 'فيديو جديد';
    const sectionName = getSectionName(grade);

    try {
        await db.collection('notifications').add({
            title:          `${typeText}: ${title}`,
            body:           `تم إضافة ${typeText} في قسم "${sectionName}" 🎉`,
            targetType:     'sections',
            targetSections: [grade],
            targetUsers:    [],
            createdAt:      firebase.firestore.FieldValue.serverTimestamp(),
            createdBy:      user.email.toLowerCase(),
            expiresAt:      null,
            autoExpire:     false,
            readBy:         [],
            active:         true,
            isAuto:         true,
        });
    } catch (e) {
        console.warn('[Notifications] auto-create error:', e);
    }
}

// ============================================
//  إغلاق اللوحة عند الضغط خارجها
// ============================================
document.addEventListener('click', function (e) {
    if (!_notifPanelOpen) return;
    const panel = document.getElementById('notifications-panel');
    if (!panel || panel.style.display === 'none') return;

    // ── لا تغلق اللوحة لو Swal مفتوح ──
    if (document.querySelector('.swal2-container:not(.swal2-toast-shown)')) return;

    const inner = panel.querySelector('#notif-panel-inner');
    if (!inner) return;
    const bellBtn = document.getElementById('notif-bell-btn');
    if ((bellBtn && bellBtn.contains(e.target)) || inner.contains(e.target)) return;
    closeNotificationsPanel();
});