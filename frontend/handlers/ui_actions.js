(() => {
function getUser()  { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }

let notificationCloseCallback = null;

function createNotificationModal() {
    let modal = document.getElementById("app-notification-modal");
    if (modal) return modal;

    modal = document.createElement("div");
    modal.id = "app-notification-modal";
    modal.className = "fixed inset-0 z-[9999] hidden items-center justify-center bg-black/45 px-4";
    modal.innerHTML = `
        <div class="w-full max-w-[420px] rounded-lg bg-white p-6 text-center shadow-xl">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#d8ebff] text-xl font-bold text-[#0080ff]">!</div>
            <h2 class="mb-2 text-xl font-bold text-[#4b4b4b]">Notifikasi</h2>
            <p id="app-notification-message" class="mb-5 text-sm leading-relaxed text-[#4b4b4b]"></p>
            <button id="app-notification-ok" class="h-11 rounded-lg bg-[#0080ff] px-8 font-bold text-white shadow-md" type="button">OK</button>
        </div>
    `;
    document.body.appendChild(modal);

    const close = () => {
        modal.classList.add("hidden");
        modal.classList.remove("flex");
        const callback = notificationCloseCallback;
        notificationCloseCallback = null;
        if (callback) callback();
    };

    modal.querySelector("#app-notification-ok").addEventListener("click", close);
    modal.addEventListener("click", (event) => {
        if (event.target === modal) close();
    });

    return modal;
}

function showAppNotification(message, onClose) {
    const modal = createNotificationModal();
    notificationCloseCallback = typeof onClose === "function" ? onClose : null;
    modal.querySelector("#app-notification-message").textContent = message || "Terjadi kesalahan.";
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

window.showAppNotification = showAppNotification;
window.alert = showAppNotification;

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
})();
