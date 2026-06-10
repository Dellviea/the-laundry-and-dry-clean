const CHAT_API_BASE_URL = "http://127.0.0.1:5000";

function getChatToken() {
    return localStorage.getItem("token");
}

function messageClass(senderRole) {
    return senderRole === "admin"
        ? "message-bubble max-w-[74%] rounded-lg py-3.5 px-4 leading-snug admin self-start bg-[#f7f7f7] border border-[#e0e0e0]"
        : "message-bubble max-w-[74%] rounded-lg py-3.5 px-4 leading-snug customer self-end bg-[#d8ebff] text-[#064d93]";
}

function renderChatMessages(messages) {
    const thread = document.getElementById("customer-chat-thread");
    if (!thread) return;

    if (!messages || messages.length === 0) {
        thread.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada pesan.</p>';
        return;
    }

    thread.innerHTML = messages.map((message) => (
        `<div class="${messageClass(message.senderRole)}">${message.message}</div>`
    )).join("");
    thread.scrollTop = thread.scrollHeight;
}

async function loadChatMessages() {
    const token = getChatToken();
    if (!token) {
        window.location.href = "../auth/login/login.html";
        return;
    }

    try {
        const response = await fetch(`${CHAT_API_BASE_URL}/chat/messages`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat chat.");
        }
        renderChatMessages(result.data.messages);
    } catch (error) {
        alert(error.message);
    }
}

async function submitChatMessage(event) {
    event.preventDefault();

    const token = getChatToken();
    const textarea = document.getElementById("customer-chat-message");
    const message = textarea.value.trim();
    if (!message) {
        alert("Tulis pesan terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch(`${CHAT_API_BASE_URL}/chat/messages`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ message }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengirim pesan.");
        }

        textarea.value = "";
        await loadChatMessages();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("customer-chat-form")?.addEventListener("submit", submitChatMessage);
    loadChatMessages();
});
