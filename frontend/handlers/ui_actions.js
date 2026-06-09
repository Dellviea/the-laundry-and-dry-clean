const BASE_URL = "http://127.0.0.1:5000";

function getToken() { return localStorage.getItem("token"); }
function getUser()  { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }

// ── Tampilkan nama user di navbar jika ada ─────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const userNameEl = document.getElementById("user-name");
    if (userNameEl) {
        const user = getUser();
        userNameEl.textContent = user?.nama || user?.email || "User";
    }
});

// ── Logout ─────────────────────────────────────────────────────
function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = '../auth/login/login.html';
}

// ── UI Actions (popup, pagination, upload) ─────────────────────
document.addEventListener("click", (event) => {
    // Popup
    const popupButton = event.target.closest("[data-popup]");
    if (popupButton) {
        alert(popupButton.dataset.popup);
        return;
    }

    // Pagination
    const pageButton = event.target.closest(".page-number");
    if (pageButton) {
        const pagination = pageButton.closest(".pagination");
        if (pagination) {
            pagination.querySelectorAll(".page-number").forEach((btn) => {
                btn.classList.remove("is-active", "!bg-[#0080ff]", "!text-white", "!border-white");
            });
            pageButton.classList.add("is-active", "!bg-[#0080ff]", "!text-white", "!border-white");
        }
        return;
    }

    // Upload box
    const uploadBox = event.target.closest(".upload-box");
    if (uploadBox) {
        alert("Fitur upload bukti akan dihubungkan ke backend nanti.");
    }

    // Logout button
    const logoutBtn = event.target.closest("[data-logout]");
    if (logoutBtn) {
        logout();
    }
});

document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-demo-form]");
    if (!form) return;
    event.preventDefault();
    alert(form.dataset.success || "Data berhasil diproses.");
});