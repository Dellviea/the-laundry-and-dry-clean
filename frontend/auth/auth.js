document.addEventListener('DOMContentLoaded', () => {

    // ================= LOGIN =================
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault(); 
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const emailError = document.getElementById('email-error');
            const passwordError = document.getElementById('password-error');

            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();

            emailInput.classList.remove('border-red-500','border-2','outline-red-500');
            passwordInput.classList.remove('border-red-500','border-2','outline-red-500');
            emailError.classList.add('hidden');
            passwordError.classList.add('hidden');

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
                const res = await fetch("http://127.0.0.1:5000/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue
                    })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    window.location.href = '../../customer/home.html';
                }

            } catch (err) {
                alert("Tidak bisa connect ke backend!");
                console.error(err);
            }
        });
    }

    // ================= REGISTER =================
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const confirmInput = document.getElementById('confirm_password'); 
            const emailError = document.getElementById('email-error');
            const passwordError = document.getElementById('password-error');
            const reEnterPasswordError = document.getElementById('reEnterPassword-error');
            const passwordNotSame = document.getElementById('password-notSame');
            const reEnterPasswordNotSame = document.getElementById('reEnterPassword-notSame');

            const emailValue = emailInput.value.trim();
            const passwordValue = passwordInput.value.trim();
            const confirmValue = confirmInput.value.trim();

            emailInput.classList.remove('border-red-500','border-2','outline-red-500');
            passwordInput.classList.remove('border-red-500','border-2','outline-red-500');
            confirmInput.classList.remove('border-red-500','border-2','outline-red-500');
            emailError.classList.add('hidden');
            passwordError.classList.add('hidden');
            reEnterPasswordError.classList.add('hidden');
            passwordNotSame.classList.add('hidden');
            reEnterPasswordNotSame.classList.add('hidden');

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
                const res = await fetch("http://127.0.0.1:5000/register", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailValue,
                        password: passwordValue,
                        confirm_password: confirmValue
                    })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    window.location.href = '../login/login.html';
                }

            } catch (err) {
                alert("Tidak bisa connect ke backend!");
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

            emailInput.classList.remove('border-red-500','border-2','outline-red-500');
            emailError.classList.add('hidden');

            let isValid = true;

            if (!emailValue) {
                emailInput.classList.add('border-red-500','border-2','outline-red-500');
                emailError.classList.remove('hidden');
                isValid = false;
            }

            if (!isValid) return;

            try {
                const res = await fetch("http://127.0.0.1:5000/forgot-password", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email: emailValue
                    })
                });

                const data = await res.json();
                alert(data.message);

                if (res.ok) {
                    window.location.href = 'login.html';
                }

            } catch (err) {
                alert("Tidak bisa connect ke backend!");
                console.error(err);
            }
        });
    }

});
