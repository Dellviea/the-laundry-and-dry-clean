const BASE_URL = "http://127.0.0.1:5000";

function setFieldError(inputEl, errorEl, message) {
    if (!inputEl || !errorEl) return;
    inputEl.classList.add('border-red-500','border-2','outline-red-500');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
}

function clearFieldError(inputEl, errorEl, fallbackMessage) {
    if (!inputEl || !errorEl) return;
    inputEl.classList.remove('border-red-500','border-2','outline-red-500');
    if (fallbackMessage) errorEl.textContent = fallbackMessage;
    errorEl.classList.add('hidden');
}

function setLoginBackendError(emailInput, passwordInput, emailError, passwordError, message) {
    setFieldError(emailInput, emailError, message);
    setFieldError(passwordInput, passwordError, message);
}

function setRegisterBackendError(inputs, errors, message) {
    const lowerMessage = (message || "").toLowerCase();
    if (lowerMessage.includes("email")) {
        setFieldError(inputs.email, errors.email, message);
        return;
    }
    if (lowerMessage.includes("password") || lowerMessage.includes("konfirmasi")) {
        setFieldError(inputs.password, errors.password, message);
        setFieldError(inputs.confirm, errors.confirm, message);
        return;
    }
    setFieldError(inputs.firstName, errors.firstName, message || "Data registrasi tidak valid.");
}

document.addEventListener('DOMContentLoaded', () => {

    // ================= LOGIN =================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput     = document.getElementById('email');
            const passwordInput  = document.getElementById('password');
            const emailError     = document.getElementById('email-error');
            const passwordError  = document.getElementById('password-error');

            const emailValue    = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();

            clearFieldError(emailInput, emailError, "Email tidak boleh kosong!");
            clearFieldError(passwordInput, passwordError, "Password tidak boleh kosong!");

            let isValid = true;
            if (!emailValue) {
                emailInput.classList.add('border-red-500','border-2','outline-red-500');
                emailError.classList.remove('hidden');
                isValid = false;
            }
            if (!passwordValue) {
                passwordInput.classList.add('border-red-500','border-2','outline-red-500');
                passwordError.classList.remove('hidden');
                isValid = false;
            }
            if (!isValid) return;

            try {
                const res  = await fetch(`${BASE_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailValue, password: passwordValue })
                });
                const data = await res.json();

                if (res.ok) {
                    // Simpan token & data user ke localStorage
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user",  JSON.stringify(data.data.user));
                    const role = (data.data.user.role || "").toLowerCase();
                    window.location.href = role === "admin" ? "../../admin/dashboard.html" : "../../customer/home.html";
                } else {
                    setLoginBackendError(emailInput, passwordInput, emailError, passwordError, data.message || "Email atau password salah.");
                }
            } catch (err) {
                setLoginBackendError(emailInput, passwordInput, emailError, passwordError, "Tidak bisa connect ke backend!");
                console.error(err);
            }
        });
    }

    // ================= REGISTER =================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const firstNameInput = document.getElementById('first_name');
            const lastNameInput  = document.getElementById('last_name');
            const emailInput     = document.getElementById('email');
            const passwordInput  = document.getElementById('password');
            const confirmInput   = document.getElementById('confirm_password');
            const firstNameError = document.getElementById('first-name-error');
            const emailError           = document.getElementById('email-error');
            const passwordError        = document.getElementById('password-error');
            const reEnterPasswordError = document.getElementById('reEnterPassword-error');
            const passwordNotSame      = document.getElementById('password-notSame');
            const reEnterPasswordNotSame = document.getElementById('reEnterPassword-notSame');

            const firstNameValue = firstNameInput.value.trim();
            const lastNameValue  = lastNameInput.value.trim();
            const emailValue     = emailInput.value.trim();
            const passwordValue  = passwordInput.value.trim();
            const confirmValue   = confirmInput.value.trim();

            clearFieldError(firstNameInput, firstNameError, "First name tidak boleh kosong!");
            clearFieldError(emailInput, emailError, "Email tidak boleh kosong!");
            clearFieldError(passwordInput, passwordError, "Password tidak boleh kosong!");
            clearFieldError(confirmInput, reEnterPasswordError, "Password tidak boleh kosong!");
            passwordNotSame.classList.add('hidden');
            reEnterPasswordNotSame.classList.add('hidden');

            let isValid = true;
            if (!firstNameValue) {
                firstNameInput.classList.add('border-red-500','border-2','outline-red-500');
                firstNameError.classList.remove('hidden');
                isValid = false;
            }
            if (!emailValue) {
                emailInput.classList.add('border-red-500','border-2','outline-red-500');
                emailError.classList.remove('hidden');
                isValid = false;
            }
            if (!passwordValue) {
                passwordInput.classList.add('border-red-500','border-2','outline-red-500');
                passwordError.classList.remove('hidden');
                isValid = false;
            }
            if (!confirmValue) {
                confirmInput.classList.add('border-red-500','border-2','outline-red-500');
                reEnterPasswordError.classList.remove('hidden');
                isValid = false;
            }
            if (!isValid) return;

            if (passwordValue !== confirmValue) {
                passwordInput.classList.add('border-red-500','border-2');
                confirmInput.classList.add('border-red-500','border-2');
                passwordNotSame.classList.remove('hidden');
                reEnterPasswordNotSame.classList.remove('hidden');
                return;
            }

            try {
                const res  = await fetch(`${BASE_URL}/register`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email:            emailValue,
                        password:         passwordValue,
                        confirm_password: confirmValue,
                        nama:             `${firstNameValue} ${lastNameValue}`.trim()
                    })
                });
                const data = await res.json();

                if (res.ok) {
                    // Simpan token & user langsung setelah register
                    localStorage.setItem("token", data.data.token);
                    localStorage.setItem("user",  JSON.stringify(data.data.user));
                    window.location.href = '../../customer/home.html';
                } else {
                    setRegisterBackendError(
                        { firstName: firstNameInput, email: emailInput, password: passwordInput, confirm: confirmInput },
                        { firstName: firstNameError, email: emailError, password: passwordError, confirm: reEnterPasswordError },
                        data.message
                    );
                }
            } catch (err) {
                setFieldError(emailInput, emailError, "Tidak bisa connect ke backend!");
                console.error(err);
            }
        });
    }

    // ================= FORGOT PASSWORD =================
    const forgotPassword = document.getElementById('forgot-form');
    if (forgotPassword) {
        forgotPassword.addEventListener('submit', async function(e) {
            e.preventDefault();

            const emailInput = document.getElementById('email');
            const emailError = document.getElementById('email-error');
            const emailValue = emailInput.value.trim();

            clearFieldError(emailInput, emailError, "Email tidak boleh kosong!");

            if (!emailValue) {
                emailInput.classList.add('border-red-500','border-2','outline-red-500');
                emailError.classList.remove('hidden');
                return;
            }

            try {
                const res  = await fetch(`${BASE_URL}/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: emailValue })
                });
                const data = await res.json();

                if (res.ok) {
                    window.location.href = 'login.html';
                } else {
                    setFieldError(emailInput, emailError, data.message || "Email tidak valid.");
                }
            } catch (err) {
                setFieldError(emailInput, emailError, "Tidak bisa connect ke backend!");
                console.error(err);
            }
        });
    }

});

// ── Helper: ambil token dari localStorage ──────────────────────
function getToken() {
    return localStorage.getItem("token");
}

// ── Helper: ambil data user dari localStorage ─────────────────
function getUser() {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
}

// ── Helper: cek sudah login, kalau belum redirect ke login ────
function requireLogin() {
    if (!getToken()) {
        window.location.href = '../auth/login/login.html';
        return false;
    }
    return true;
}

// ── Logout ────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = '../auth/login/login.html';
}
