// ============================================
//  landing.js — Firebase Auth Check
//  إذا كان المستخدم مسجل دخوله → يُحوَّل لـ index.html
// ============================================

// Firebase مُبدَّأ بالفعل في firebase-config.js
// ننتظر auth state يتحدد
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // المستخدم محفوظ جلسته — نحوله مباشرة للمنصة
        window.location.replace('index.html');
    }
    // لو مش مسجل: نظهر صفحة الـ Landing
});

// ============================================
//  دالة تسجيل الدخول (نفس منطق app.js)
// ============================================
async function loginWithGoogle() {
    const btn = document.getElementById('cta-login-btn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-spinner"></span> جاري الاتصال...';
    }
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await firebase.auth().signInWithPopup(provider);
        // onAuthStateChanged سيتولى التحويل
    } catch (error) {
        if (error.code === 'auth/popup-closed-by-user') {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fab fa-google"></i> دخول المنصة بحساب Google';
            }
            return;
        }
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fab fa-google"></i> دخول المنصة بحساب Google';
        }
        console.error('Login error:', error);
    }
}

// ============================================
//  Intersection Observer — Scroll Animations
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // ── Typing effect for hero ──
    const typingEl = document.getElementById('typing-text');
    const words = ['مواقع احترافية', 'تطبيقات ذكية', 'مشاريع حقيقية', 'مستقبلك في التقنية'];
    let wIdx = 0, cIdx = 0, deleting = false;

    function typeLoop() {
        const current = words[wIdx];
        if (!deleting) {
            typingEl.textContent = current.slice(0, ++cIdx);
            if (cIdx === current.length) {
                deleting = true;
                setTimeout(typeLoop, 1800);
                return;
            }
        } else {
            typingEl.textContent = current.slice(0, --cIdx);
            if (cIdx === 0) {
                deleting = false;
                wIdx = (wIdx + 1) % words.length;
            }
        }
        setTimeout(typeLoop, deleting ? 55 : 90);
    }
    if (typingEl) setTimeout(typeLoop, 700);

    // ── Scroll progress bar ──
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY;
            const total = document.body.scrollHeight - window.innerHeight;
            progressBar.style.width = (scrolled / total * 100) + '%';
        }, { passive: true });
    }

    // ── Counter animation ──
    const counters = document.querySelectorAll('[data-count]');
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const target = parseInt(el.dataset.count);
            const duration = 1600;
            const step = target / (duration / 16);
            let current = 0;
            const timer = setInterval(() => {
                current = Math.min(current + step, target);
                el.textContent = Math.floor(current) + (el.dataset.suffix || '');
                if (current >= target) clearInterval(timer);
            }, 16);
            counterObs.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObs.observe(el));
});