(function () {
    const API_BASE_URL = "http://127.0.0.1:5000";
    let activeCustomerId = null;
    let customers = [];

    function getToken() {
        return localStorage.getItem("token");
    }

    function headers() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
        };
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
        }[char]));
    }

    async function api(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Request chat gagal.");
        }
        return result.data;
    }

    function initial(name) {
        return (name || "?").charAt(0).toUpperCase();
    }

    function renderCustomers() {
        const list = document.querySelector(".admin-chat-list");
        if (!list) return;

        if (customers.length === 0) {
            list.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada chat dari customer.</p>';
            resetActiveChat();
            return;
        }

        list.innerHTML = customers.map((customer) => {
            const selected = String(customer.idUser) === String(activeCustomerId);
            return `
                <article class="admin-chat-row grid grid-cols-[52px_minmax(0,1fr)_auto] gap-4 items-center border rounded-lg py-4 px-[18px] ${selected ? "bg-[#d8ebff] border-[#0080ff]" : "bg-[#f7f7f7] border-[#e0e0e0]"}" data-customer-id="${customer.idUser}">
                    <div class="admin-avatar w-11 h-11 rounded-full bg-[#d8ebff] text-[#0080ff] font-bold flex items-center justify-center">${initial(customer.nama)}</div>
                    <div class="min-w-0">
                        <div class="admin-row-title font-bold mb-1">${escapeHtml(customer.nama || customer.email || "Customer")}</div>
                        <div class="admin-row-copy overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-snug">${customer.unreadCount ? "New message" : escapeHtml(customer.email || "-")}</div>
                    </div>
                    <button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg font-bold px-4 cursor-pointer ${selected ? "bg-[#0080ff] text-white" : "bg-white text-[#0080ff]"}" type="button" data-open-customer="${customer.idUser}">${selected ? "Dibuka" : "Buka Chat"}</button>
                </article>
            `;
        }).join("");
    }

    function renderMessages(messages) {
        const thread = document.getElementById("admin-chat-thread");
        if (!thread) return;

        if (!messages.length) {
            thread.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada pesan.</p>';
            return;
        }

        thread.innerHTML = messages.map((message) => {
            const isAdmin = message.senderRole === "admin";
            const bubbleClass = isAdmin
                ? "self-end bg-[#d8ebff] text-[#064d93]"
                : "self-start bg-[#f7f7f7] border border-[#e0e0e0]";
            return `<div class="message-bubble max-w-[74%] rounded-lg py-3.5 px-4 leading-snug ${bubbleClass}" style="overflow-wrap:anywhere; word-break:break-word; white-space:pre-wrap;">${escapeHtml(message.message)}</div>`;
        }).join("");
        thread.scrollTop = thread.scrollHeight;
    }

    function resetActiveChat() {
        activeCustomerId = null;
        const avatar = document.getElementById("active-chat-avatar");
        const name = document.getElementById("active-chat-name");
        const subtitle = document.getElementById("active-chat-subtitle");
        const thread = document.getElementById("admin-chat-thread");
        const input = document.getElementById("admin-chat-message");
        const submit = document.querySelector("#admin-chat-form button[type='submit']");

        if (avatar) avatar.textContent = "-";
        if (name) name.textContent = "Belum ada chat";
        if (subtitle) subtitle.textContent = "Percakapan akan muncul setelah customer mengirim pesan.";
        if (thread) thread.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada percakapan yang dipilih.</p>';
        if (input) {
            input.value = "";
            input.placeholder = "Belum ada customer yang bisa dibalas";
            input.disabled = true;
        }
        if (submit) submit.disabled = true;
    }

    async function loadCustomers() {
        const data = await api("/admin/chat/customers", {
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        customers = data.customers || [];
        if (!activeCustomerId && customers.length > 0) {
            activeCustomerId = customers[0].idUser;
        }
        renderCustomers();
    }

    async function openCustomer(customerId) {
        activeCustomerId = customerId;
        const customer = customers.find((item) => String(item.idUser) === String(customerId));

        document.getElementById("active-chat-avatar").textContent = initial(customer?.nama);
        document.getElementById("active-chat-name").textContent = customer?.nama || customer?.email || "Customer";
        document.getElementById("active-chat-subtitle").textContent = "Percakapan dengan customer";
        const input = document.getElementById("admin-chat-message");
        const submit = document.querySelector("#admin-chat-form button[type='submit']");
        if (input) {
            input.disabled = false;
            input.placeholder = `Tulis balasan untuk ${customer?.nama || "customer"}`;
        }
        if (submit) submit.disabled = false;

        renderCustomers();
        const data = await api(`/chat/messages?idUser=${customerId}`, {
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        renderMessages(data.messages || []);
    }

    async function sendReply(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!activeCustomerId) {
            alert("Pilih customer terlebih dahulu.");
            return;
        }

        const input = document.getElementById("admin-chat-message");
        const message = input.value.trim();
        if (!message) return;

        await api("/chat/messages", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ idUser: activeCustomerId, message }),
        });

        input.value = "";
        await openCustomer(activeCustomerId);
        await loadCustomers();
    }

    async function init() {
        if (!getToken()) {
            window.location.href = "../auth/login/login.html";
            return;
        }

        document.querySelector(".admin-chat-list")?.addEventListener("click", (event) => {
            const button = event.target.closest("[data-open-customer]");
            if (button) {
                openCustomer(button.dataset.openCustomer).catch((error) => alert(error.message));
            }
        });

        document.getElementById("admin-chat-form")?.addEventListener("submit", (event) => {
            sendReply(event).catch((error) => alert(error.message));
        }, true);

        await loadCustomers();
        if (activeCustomerId) await openCustomer(activeCustomerId);
    }

    document.addEventListener("DOMContentLoaded", () => {
        init().catch((error) => alert(error.message));
    });
}());
