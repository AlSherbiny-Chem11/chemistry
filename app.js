let s_grade = localStorage.getItem('s_grade');
let editingId = null;
let unsubscribe = null;

// إدارة حالة تسجيل الدخول - النسخة المعتمدة على الرتب
auth.onAuthStateChanged(async (user) => {
    if (user) {
        try {
            const userEmail = user.email.toLowerCase();
            const userDoc = await db.collection("users_access").doc(userEmail).get();

           if (!userDoc.exists) {
                await auth.signOut();
                
                // إظهار شاشة اللوجن فوراً عشان نضمن إننا واقفين عليها
                showLoginScreen();

                await Swal.fire({
                    title: 'عفواً.. الحساب غير مسجل!',
                    text: 'إيميلك مش متضاف في المنصة، تواصل مع مستر محمد الشربيني لتفعيل حسابك.',
                    icon: 'error',
                    confirmButtonText: 'حسناً، فهمت',
                    background: '#111827',
                    color: '#fff',
                    confirmButtonColor: '#c5a059',
                    // --- السطرين دول هما الحل ---
                    target: document.getElementById('auth-screen'), // تظهر جوه شاشة اللوجن نفسها
                    heightAuto: false,
                    // ----------------------------
                    allowOutsideClick: false,
                    allowEscapeKey: false
                });
                
                return;
            }

            const userData = userDoc.data();
            const userRole = userData.role;
            // جلب الصف من الداتابيز لو ملوش صف في الـ localStorage
            const savedGrade = userData.lastGrade; 

            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('app-header').classList.remove('hidden');
            document.getElementById('app-content').classList.remove('hidden');

            updateUserProfile(user);

            // صلاحية زرار الإدارة
            const adminBtn = document.querySelector('button[onclick="checkAdmin()"]');
            if (userRole === 'master' || userRole === 'teacher') {
                if (adminBtn) {
                    adminBtn.style.display = 'flex';
                    adminBtn.setAttribute('onclick', 'openAdminDirect()');
                }
            } else {
                if (adminBtn) adminBtn.style.display = 'none';
            }

            // === المنطق الجديد لاختيار الصف ===
            if (s_grade) {
                // لو المتصفح فاكر الصف (زي ما إحنا)
                selectGrade(s_grade, "");
            } else if (savedGrade) {
                // لو المتصفح نسي بس الداتابيز فاكرة
                selectGrade(savedGrade, "");
            } else {
                // لو أول مرة يدخل خالص ومفيش أي بيانات
                openGradePicker();
            }
            // ================================

        } catch (error) {
            console.error("Access Error:", error);
            auth.signOut();
        }
    } else {
        showLoginScreen();
    }
});

// دالة مساعدة لتحديث بيانات البروفايل
function updateUserProfile(user) {
    const avatarImg = document.getElementById('user-avatar');
    if (avatarImg && user.photoURL) {
        avatarImg.referrerPolicy = "no-referrer";
        avatarImg.src = user.photoURL;
    }
    const nameSpan = document.getElementById('user-first-name');
    if (nameSpan && user.displayName) {
        nameSpan.innerText = user.displayName.split(' ')[0];
    }
}

async function login() { 
    try {
        const p = new firebase.auth.GoogleAuthProvider(); 
        await auth.signInWithPopup(p); 
    } catch (error) {
        console.error("Login Error:", error);
        showToast("حدثت مشكلة في الاتصال بـ Firebase");
    }
}

function logout() { 
    auth.signOut(); 
    localStorage.removeItem('s_grade'); 
    location.reload(); 
}

function toggleMenu() {
    const menu = document.getElementById('drop-menu');
    if (menu.style.display === 'flex') {
        menu.style.display = 'none';
    } else {
        menu.style.display = 'flex';
    }
}

function openGradePicker() { 
    document.getElementById('grade-picker').classList.remove('hidden'); 
    if(document.getElementById('drop-menu').style.display === 'flex') toggleMenu(); 
}

// ضفنا async هنا عشان الدالة بقت بتكلم الداتابيز
async function selectGrade(id, name) {
    s_grade = id;
    localStorage.setItem('s_grade', id);
    document.getElementById('grade-picker').classList.add('hidden');
    
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = "";
    
    const map = {
        '1-mid':'الأول الإعدادي',
        '2-mid':'الثاني الإعدادي',
        '3-mid':'الثالث الإعدادي',
        '1-sec':'الأول الثانوي',
        '2-sec':'الثاني الثانوي',
        '3-sec':'الثالث الثانوي'
    };
    document.getElementById('grade-title').innerText = "محاضرات " + (name || map[id]);

    // دي الحتة اللي بتكلم الداتابيز (users_access)
    if (auth.currentUser) {
        const userEmail = auth.currentUser.email.toLowerCase();
        // await هنا معناها "استنى لما ترفع الصف للفايربيس وبعدين كمل"
        await db.collection("users_access").doc(userEmail).set({
            lastGrade: id
        }, { merge: true }).catch(e => console.log("Grade sync failed"));
    }

    loadLessons(id);
}

// دالة تنسيق الروابط (YouTube & Google Drive)
function formatUrl(url) {
    if (url.includes('youtube.com/watch?v=')) return url.replace('watch?v=', 'embed/') + "?rel=0&showinfo=0&controls=0";
    if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'youtube.com/embed/') + "?rel=0&showinfo=0&controls=0";
    if (url.includes('drive.google.com')) return url.replace(/\/view.*|\/edit.*|\/preview.*/, '/preview');
    return url;
}

function loadLessons(grade) {
    const grid = document.getElementById('lesson-grid');
    const template = document.getElementById('lesson-card-template');
    
    grid.innerHTML = "";

    db.collection("lessons").where("grade", "==", grade).onSnapshot((querySnapshot) => {
        grid.innerHTML = ""; 
        
        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const clone = template.content.cloneNode(true);
            const url = item.url;

            let thumbnailUrl = "";

            // استخراج صورة يوتيوب
            if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const videoId = url.split('v=')[1]?.split('&')[0] || url.split('/').pop();
                thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
            } 
            // استخراج صورة جوجل درايف 
            else if (url.includes('drive.google.com')) {
                const match = url.match(/\/d\/(.+?)\//);
                if (match) {
                    const fileId = match[1];
                    thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
                }
            }

            const mediaBox = clone.querySelector('.card-media-box');
            // نضع صورة فقط وليس إطار فيديو لمنع التشغيل داخل الكارت
            mediaBox.innerHTML = `
                <div class="video-preview-container">
                    <img src="${thumbnailUrl}" class="video-thumb-img" onerror="this.src='https://via.placeholder.com/640x360/111827/FFFFFF?text=Lesson+Video'">
                    <div class="play-icon-overlay"><i class="fas fa-play"></i></div>
                </div>`;

            clone.querySelector('.lesson-name').innerText = item.title;

            // عند الضغط على الكارت بالكامل يفتح الفيديو الكبير
            const card = clone.querySelector('.lesson-card');
            card.onclick = () => playVideo(item.url);

            grid.appendChild(clone);
        });
    });
}

async function publish() { 
    const title = document.getElementById('v-title').value; 
    const url = document.getElementById('v-url').value; 
    const grade = document.getElementById('v-grade').value; 
    const btn = document.getElementById('pub-btn');

    if(!title || !url) return showToast("أكمل البيانات!", "error"); // كلمة error هنا هي اللي هتحط علامة الـ (X) الحمراء 
    
    btn.disabled = true;
    btn.innerText = "جاري الحفظ... ⏳";

    try {
        if (editingId) {
            // وضع التعديل: تحديث المستند الموجود
            await db.collection("lessons").doc(editingId).update({
                title: title,
                url: url,
                grade: grade
            });
            showToast("تم تحديث الدرس بنجاح ✅");
        } else {
            // وضع الإضافة: إنشاء مستند جديد
            await db.collection("lessons").add({ 
                title: title, 
                url: url, 
                grade: grade, 
                createdAt: firebase.firestore.FieldValue.serverTimestamp() 
            });
            showToast("تم نشر الدرس بنجاح 🚀");
        }

        // إعادة ضبط اللوحة للوضع الطبيعي
        resetAdminForm();
    } catch (e) {
        console.error(e);
        showToast("حدث خطأ!");
    } finally {
        btn.disabled = false;
    }
}

// وظيفة مساعدة لمسح الخانات وإرجاع الزرار لأصله
function resetAdminForm() {
    editingId = null;
    document.getElementById('v-title').value = "";
    document.getElementById('v-url').value = "";
    const btn = document.getElementById('pub-btn');
    btn.innerText = "نشر الدرس الآن 🚀";
    btn.className = "btn-gold p-5 rounded-2xl font-black text-lg";
}

function loadAdminLessons() { 
    const list = document.getElementById('admin-lessons-list');
    
    // هنجيب الدروس ونعمل لها ترتيب بالتاريخ
    db.collection("lessons").orderBy("createdAt", "desc").onSnapshot(snap => { 
        let h = "";
        let count = 0; // عداد عشان نعرف فيه دروس ولا لأ

        snap.forEach(doc => { 
            const data = doc.data();

            // ================= الشرط السحري هنا =================
            // لو "صف الدرس" بيساوي "الصف اللي أنا فاتحه دلوقتي" بس هو اللي يظهر
            if (data.grade === s_grade) {
                count++;
                h += `
                <div class="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 animate__animated animate__fadeInRight">
                    <div class="flex flex-col">
                        <span class="font-black text-sm text-white">${data.title}</span>
                        <span class="text-[10px] text-[#c5a059] italic">المعرف: ${doc.id.substring(0,5)}...</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="prepareEdit('${doc.id}', '${data.title}', '${data.url}', '${data.grade}')" 
                                class="bg-blue-600/10 text-blue-500 border border-blue-500/30 px-3 py-2 rounded-xl font-black hover:bg-blue-600 hover:text-white transition text-[11px]">
                            تعديل
                        </button>
                        <button onclick="deleteDoc('${doc.id}')" 
                                class="bg-red-600/10 text-red-500 border border-red-500/30 px-3 py-2 rounded-xl font-black hover:bg-red-600 hover:text-white transition text-[11px]">
                            حذف
                        </button>
                    </div>
                </div>`;
            }
        });

        // لو مفيش دروس في الصف ده، نعرض رسالة بسيطة
        if (count === 0) {
            list.innerHTML = `<div class="text-center py-8 text-gray-500 font-bold text-sm">لا توجد دروس مرفوعة لهذا الصف حالياً.</div>`;
        } else {
            list.innerHTML = h;
        }
    });
}

async function deleteDoc(id) {
    const result = await Swal.fire({
        // التارجت هنا المودال عشان الرسالة تظهر فوقه بالظبط
        target: document.getElementById('admin-modal'), 
        title: 'حذف الفيديو؟',
        text: "لن تتمكن من استعادة هذا الفيديو مجدداً بعد الحذف",
        icon: 'error',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // أحمر للحذف
        cancelButtonColor: '#6b7280', // رمادي للإلغاء
        confirmButtonText: 'نعم، احذف نهائياً',
        cancelButtonText: 'تراجع',
        background: '#111827',
        color: '#fff',
        // السطور اللي بتثبت الرسالة في نص الشاشة ومنع السكرول
        heightAuto: false,
        scrollbarPadding: false,
        returnFocus: false
    });

    if (result.isConfirmed) {
        try {
            await db.collection("lessons").doc(id).delete();
            showToast("تم حذف الفيديو بنجاح ✅");
            // لو عايز تحدث القائمة فوراً
            if(typeof loadAdminLessons === "function") loadAdminLessons();
        } catch (error) {
            showToast("حدث خطأ أثناء الحذف", "error");
        }
    }
}

// --- تعديل بسيط لضمان تفعيل الزر عند فتح اللوحة ---
function openAdminDirect() {
    document.getElementById('admin-modal').style.display = 'flex';
    
    // تأكد من استدعاء التبديل هنا لضبط الشكل الافتراضي
    switchTab('lessons'); 
    
    loadAdminLessons();
    loadUsersList();
}

function closeAdmin() { 
    document.getElementById('admin-modal').style.display = 'none'; 
    resetAdminForm(); 
    // يفضل ترجعها للوضع الافتراضي
    switchTab('lessons');
}

async function addUser() {
    const emailInput = document.getElementById('new-user-email');
    const email = emailInput.value.trim().toLowerCase();
    const role = document.getElementById('new-user-role').value;
    const btn = document.getElementById('add-user-btn');

    if (!email) return showToast("اكتب الإيميل الأول!", "warning");

    btn.disabled = true;
    try {
        const myDoc = await db.collection("users_access").doc(auth.currentUser.email.toLowerCase()).get();
        const myRole = myDoc.data()?.role;

        // --- الجزء السحري هنا ---
        // لو بنعدل (الزرار فيه كلمة تحديث) والإيميل الجديد مختلف عن الإيميل اللي ضغطنا عليه تعديل
        if (btn.innerText.includes("تحديث") && editingId && editingId !== email) {
            // حذف الإيميل القديم أولاً لأنه اتغير
            await db.collection("users_access").doc(editingId).delete();
        }

        // فحص الحماية للمساعد
        if (myRole === 'teacher' && (role === 'master' || role === 'teacher')) {
             btn.disabled = false;
             return showToast("صلاحيتك إضافة طلاب فقط!", "error");
        }

        // حفظ البيانات (سواء إيميل جديد أو تحديث)
        await db.collection("users_access").doc(email).set({
            role: role,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        showToast("تم حفظ البيانات بنجاح ✅");
        
        // إعادة ضبط الفورم
        emailInput.value = "";
        editingId = null; // تصفير معرف التعديل
        btn.innerText = "إضافة الإيميل الآن +";
        btn.classList.remove('bg-green-600');
        btn.style.backgroundColor = "";

    } catch (e) {
        showToast("حدث خطأ في العملية", "error");
    } finally {
        btn.disabled = false;
    }
}


function loadUsersList() {
    const list = document.getElementById('admin-users-list');
    
    db.collection("users_access").onSnapshot(snap => {
        let h = "";
        const currentUserEmail = auth.currentUser.email.toLowerCase();
        
        // جلب رتبة الشخص اللي فاتح اللوحة حالياً
        db.collection("users_access").doc(currentUserEmail).get().then(myDoc => {
            const myRole = myDoc.data()?.role;

            snap.forEach(doc => {
                const data = doc.data();
                const targetEmail = doc.id.toLowerCase();
                const targetRole = data.role;
                const isTargetMaster = targetRole === 'master';
                const isTargetTeacher = targetRole === 'teacher';
                const isTargetStudent = targetRole === 'student';
                const isTargetSelf = targetEmail === currentUserEmail;

             // --- 1. تحديد نص وشكل الرتبة (Badge) ---
                let badgeText = "";
                let badgeStyle = "";

                if (isTargetMaster) {
                    badgeText = "👑 المشرف العام (المستر)";
                    badgeStyle = "master-badge text-[9px]"; // الكلاس ده ضيفناه في الـ CSS
                } else if (isTargetTeacher) {
                    badgeText = "🛡️ مدرس مساعد";
                    badgeStyle = "text-yellow-500 font-bold";
                } else {
                    badgeText = "🎓 طالب ";
                    badgeStyle = "text-blue-400";
                }

                // --- 2. بناء شكل الكارت في القائمة ---
                h += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 mb-2 animate__animated animate__fadeInUp">
                    <div class="flex flex-col text-right">
                        <span class="text-white text-sm font-bold">${doc.id}</span>
                        <span class="${badgeStyle}">${badgeText}</span>
                    </div>
                    <div class="flex items-center gap-2">
                        
                        ${ (myRole === 'master') || (myRole === 'teacher' && isTargetStudent) ? `
                            <button onclick="prepareUserEdit('${doc.id}', '${targetRole}')" 
                                    class="text-[10px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500 hover:text-white transition font-bold">
                                تعديل
                            </button>` : '' 
                        }

                        ${ ((myRole === 'master' && !isTargetSelf) || (myRole === 'teacher' && isTargetStudent)) ? `
                            <button onclick="deleteUser('${doc.id}')" class="text-red-500 p-2 hover:bg-red-500/10 rounded-full transition">
                                <i class="fas fa-trash-alt"></i>
                            </button>` : '' 
                        }

                    </div>
                </div>`;
            });
            list.innerHTML = h || '<div class="text-gray-500 text-xs text-center">لا يوجد مستخدمين</div>';
        });
    });
}

function prepareUserEdit(email, role) {
    // تخزين الإيميل الأصلي في المتغير العالمي عشان لو غيرناه نحذفه
    editingId = email; 
    
    document.getElementById('new-user-email').value = email;
    document.getElementById('new-user-role').value = role;
    
    const addBtn = document.getElementById('add-user-btn');
    addBtn.innerText = "تحديث البيانات الآن 💾";
    addBtn.classList.add('bg-green-600');
    
    // سكرول بسيط لفوق عشان تبدأ تعدل
    document.querySelector('.users-section').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('new-user-email').focus();
}

// دالة إظهار شاشة تسجيل الدخول (اللي كانت بتعمل Error)
function showLoginScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('app-content').classList.add('hidden');
}


async function deleteUser(email) {
    const result = await Swal.fire({
        target: document.getElementById('admin-modal'),
        title: 'هل أنت متأكد؟',
        text: `سيتم حذف صلاحية: ${email}`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء',
        background: '#111827',
        color: '#fff',
        // --- السطور السحرية لحل مشكلة الظهور تحت ---
        heightAuto: false, // بيمنع المكتبة إنها تغير طول الصفحة
        scrollbarPadding: false,
        returnFocus: false, // عشان ما يرجعش يرميك في مكان غلط بعد ما تخلص
        // ------------------------------------------
    });

    if (result.isConfirmed) {
        await db.collection("users_access").doc(email).delete();
        showToast("تم حذف المستخدم بنجاح", "success");
    }
}

function closeAdmin() { 
    document.getElementById('admin-modal').style.display = 'none'; 
    resetAdminForm(); // عشان لو فتحتها تاني متلاقيش بيانات التعديل القديمة
}
function playVideo(url) { 
    const frame = document.getElementById('main-video-frame');
    frame.src = formatUrl(url).replace("controls=0", "controls=1"); // نعيد أزرار التحكم في شاشة العرض
    document.getElementById('video-player-modal').style.display = 'flex'; 
}

function closePlayer() { 
    document.getElementById('main-video-frame').src = ""; 
    document.getElementById('video-player-modal').style.display = 'none'; 
}

function filterVideos() {
    // 1. نجيب الكلمة اللي الطالب كتبها ونحولها لحروف صغيرة
    const searchValue = document.getElementById('search-input').value.toLowerCase();
    
    // 2. نجيب كل الكروت اللي معروضة حالياً في الصفحة
    const cards = document.querySelectorAll('.lesson-card');

    cards.forEach(card => {
        // 3. نجيب عنوان الدرس من جوه الكارت
        const title = card.querySelector('.lesson-name').innerText.toLowerCase();
        
        // 4. لو العنوان فيه الكلمة اللي بنبحث عنها، نظهره.. لو مفيش، نخفيه
        if (title.includes(searchValue)) {
            card.style.display = "flex"; // إظهار
            card.classList.add('animate__fadeIn'); // إضافة حركة بسيطة
        } else {
            card.style.display = "none"; // إخفاء
        }
    });
}

function prepareEdit(id, title, url, grade) {
    // 1. خزن معرف الدرس اللي بنعدله
    editingId = id;
    
    // 2. املأ الخانات بالبيانات القديمة
    document.getElementById('v-title').value = title;
    document.getElementById('v-url').value = url;
    document.getElementById('v-grade').value = grade;
    
    // 3. غير نص الزرار عشان تعرف إنك في وضع التعديل
    const btn = document.getElementById('pub-btn');
    btn.innerText = "تحديث البيانات الآن 💾";
    btn.classList.replace('btn-gold', 'bg-blue-600');
    
    // 4. اطلع فوق لأول المودال عشان تشوف الخانات
    document.querySelector('.admin-box').scrollTop = 0;
}

function switchTab(tabName) {
    const lessonsSection = document.getElementById('section-lessons');
    const usersSection = document.getElementById('section-users');
    const lessonsBtn = document.getElementById('btn-tab-lessons');
    const usersBtn = document.getElementById('btn-tab-users');

    // إزالة كلاس active من الزرارين
    lessonsBtn.classList.remove('active');
    usersBtn.classList.remove('active');

    if (tabName === 'lessons') {
        lessonsSection.classList.remove('hidden');
        usersSection.classList.add('hidden');
        lessonsBtn.classList.add('active'); // نور زرار الدروس
    } else {
        usersSection.classList.remove('hidden');
        lessonsSection.classList.add('hidden');
        usersBtn.classList.add('active'); // نور زرار الصلاحيات
    }
}

// حط دي في آخر ملف app.js
function showToast(msg, icon = 'success') {
    // بنحدد هنا لو لوحة الإدارة مفتوحة يرمي الرسالة جواها، لو مقفولة يرميها في الصفحة العادية
    const targetElement = document.getElementById('admin-modal').style.display === 'flex' 
                         ? document.getElementById('admin-modal') 
                         : document.body;

    const Toast = Swal.mixin({
        toast: true,
        position: 'top', 
        target: targetElement, // السطر ده هو اللي هيخليها تظهر قدام عينك دايما
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        background: '#1f2937',
        color: '#ffffff',
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });

    Toast.fire({
        icon: icon,
        title: msg
    });
}

// حماية التطبيق من الإغلاق عند الضغط على زر الرجوع أثناء مشاهدة فيديو
window.onpopstate = function() {
    if (document.getElementById('video-player-modal').style.display === 'flex') {
        closePlayer();
        history.pushState(null, null, window.location.pathname);
    }
};

// تشغيل الحماية عند فتح الفيديو
function pushStateForVideo() {
    history.pushState(null, null, window.location.pathname);
}
// تأكد من استدعاء pushStateForVideo() داخل دالة openPlayer() عندك

// التنبيه عند انقطاع أو عودة الإنترنت
window.addEventListener('online', () => {
    Swal.fire({
        title: 'تم استعادة الاتصال',
        text: 'أنت الآن متصل بالإنترنت، يمكنك متابعة دروسك.',
        icon: 'success',
        timer: 3000,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
    });
});

window.addEventListener('offline', () => {
    Swal.fire({
        title: 'عذراً، لا يوجد اتصال!',
        text: 'يرجى التحقق من الإنترنت لتتمكن من مشاهدة محاضرات المستر.',
        icon: 'error',
        allowOutsideClick: false,
        showConfirmButton: true,
        confirmButtonText: 'حسناً',
        confirmButtonColor: '#c5a059'
    });
});

// --- ميزة التحديث بالسحب (Pull to Refresh) ---

let touchStart = 0;
const indicator = document.getElementById('refresh-indicator');

window.addEventListener('touchstart', (e) => {
    // تسجيل نقطة بداية اللمس
    touchStart = e.touches[0].pageY;
}, {passive: true});

window.addEventListener('touchmove', (e) => {
    const touchMove = e.touches[0].pageY;
    const distance = touchMove - touchStart;

    // لو المستخدم بيسحب لتحت وهو في أول الصفحة فوق خالص
    if (window.scrollY === 0 && distance > 100) {
        if (indicator) {
            indicator.style.top = '20px'; // إظهار المؤشر
        }
    }
}, {passive: true});

window.addEventListener('touchend', () => {
    if (indicator && parseInt(indicator.style.top) > 0) {
        // تنفيذ التحديث بعد ثانية واحدة من رفع الصباع
        setTimeout(() => {
            location.reload(); // إعادة تحميل الصفحة
        }, 1000);
    }
});