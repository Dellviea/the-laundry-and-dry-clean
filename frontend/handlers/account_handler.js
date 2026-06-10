const ACCOUNT_API_BASE_URL = "http://127.0.0.1:5000";

function getAccountToken() {
    return localStorage.getItem("token");
}

function readAccountUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function fillAccountForm(user) {
    document.getElementById("account-name").value = user?.nama || "";
    document.getElementById("account-email").value = user?.email || "";
    document.getElementById("account-phone").value = user?.noHP || "";
    document.getElementById("account-address").value = user?.alamat || "";
}

async function loadAccount() {
    const token = getAccountToken();
    if (!token) {
        window.location.href = "../auth/login/login.html";
        return;
    }

    fillAccountForm(readAccountUser());

    try {
        const response = await fetch(`${ACCOUNT_API_BASE_URL}/account`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat data akun.");
        }

        localStorage.setItem("user", JSON.stringify(result.data));
        fillAccountForm(result.data);
    } catch (error) {
        alert(error.message);
    }
}

async function submitAccount(event) {
    event.preventDefault();

    const token = getAccountToken();
    if (!token) {
        window.location.href = "../auth/login/login.html";
        return;
    }

    const payload = {
        nama: document.getElementById("account-name").value.trim(),
        email: document.getElementById("account-email").value.trim(),
        noHP: document.getElementById("account-phone").value.trim(),
        alamat: document.getElementById("account-address").value.trim(),
    };

    const password = document.getElementById("account-password").value;
    if (password) payload.password = password;

    try {
        const response = await fetch(`${ACCOUNT_API_BASE_URL}/account`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal menyimpan akun.");
        }

        localStorage.setItem("user", JSON.stringify(result.data.user));
        if (result.data.token) localStorage.setItem("token", result.data.token);
        document.getElementById("account-password").value = "";
        alert("Akun berhasil diperbarui.");
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("account-form")?.addEventListener("submit", submitAccount);
    loadAccount();
});
