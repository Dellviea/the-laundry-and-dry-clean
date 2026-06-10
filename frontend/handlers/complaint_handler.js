const COMPLAINT_API_BASE_URL = "http://127.0.0.1:5000";
let complaintProofPhoto = "";

function getComplaintToken() {
    return localStorage.getItem("token");
}

function getComplaintUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
}

function complaintDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function fillComplaintUser() {
    const user = getComplaintUser();
    const customerName = user?.nama || user?.email || "Customer";
    const customerEmail = localStorage.getItem("last_order_email") || user?.email || "-";

    document.getElementById("fixed-customer-name").textContent = customerName;
    document.getElementById("fixed-customer-email").textContent = customerEmail;
    document.getElementById("customer-name").value = customerName;
    document.getElementById("customer-email").value = customerEmail;
}

function setupComplaintProofUpload() {
    const input = document.getElementById("complaint-proof-input");
    const preview = document.getElementById("complaint-proof-preview");
    const name = document.getElementById("complaint-proof-name");
    const remove = document.getElementById("complaint-proof-remove");
    if (!input || !preview) return;

    input.addEventListener("change", () => {
        const file = input.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            alert("Bukti foto harus berupa file gambar.");
            input.value = "";
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran foto maksimal 2MB.");
            input.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const uploadedImage = new Image();
            uploadedImage.onload = () => {
                const maxSide = 1000;
                const scale = Math.min(1, maxSide / Math.max(uploadedImage.width, uploadedImage.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.max(1, Math.round(uploadedImage.width * scale));
                canvas.height = Math.max(1, Math.round(uploadedImage.height * scale));
                const context = canvas.getContext("2d");
                context.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
                complaintProofPhoto = canvas.toDataURL("image/jpeg", 0.78);

                const image = preview.querySelector("img");
                if (image) image.src = complaintProofPhoto;
                if (name) name.textContent = file.name;
                preview.classList.remove("hidden");
                preview.classList.add("flex");
            };
            uploadedImage.onerror = () => {
                alert("Bukti foto tidak bisa dibaca. Coba gunakan gambar JPG atau PNG lain.");
                input.value = "";
            };
            uploadedImage.src = String(reader.result || "");
        };
        reader.readAsDataURL(file);
    });

    remove?.addEventListener("click", () => {
        complaintProofPhoto = "";
        input.value = "";
        preview.classList.add("hidden");
        preview.classList.remove("flex");
    });
}

async function sendComplaint(payload, token) {
    const response = await fetch(`${COMPLAINT_API_BASE_URL}/complaints`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
    });

    let result = null;
    try {
        result = await response.json();
    } catch (error) {
        throw new Error("Backend mengirim response yang tidak valid. Pastikan server Flask sudah direstart.");
    }

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal mengirim complaint.");
    }

    return result;
}

async function loadComplaintOrders() {
    const token = getComplaintToken();
    if (!token) {
        window.location.href = "../auth/login/login.html";
        return;
    }

    try {
        const response = await fetch(`${COMPLAINT_API_BASE_URL}/orders/history`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat pesanan.");
        }

        const orders = result.data.orders || [];
        const orderSelect = document.getElementById("order-id");
        if (!orderSelect) return;

        orderSelect.innerHTML = orders.map((order) => (
            `<option value="${order.idOrder}">ORD-${order.idOrder} - ${complaintDate(order.tanggal)}</option>`
        )).join("");

        if (orders.length === 0) {
            orderSelect.innerHTML = '<option value="">Belum ada pesanan</option>';
        }
    } catch (error) {
        alert(error.message);
    }
}

async function submitComplaint(event) {
    event.preventDefault();

    const token = getComplaintToken();
    const orderId = document.getElementById("order-id").value;
    const jenisKeluhan = document.getElementById("complaint-type").value;
    const keluhan = document.getElementById("complaint-detail").value.trim();

    if (!orderId) {
        alert("Pilih pesanan terlebih dahulu.");
        return;
    }

    try {
        await sendComplaint({
            idOrder: Number(orderId),
            jenisKeluhan,
            keluhan,
            buktiFoto: complaintProofPhoto,
        }, token);

        document.getElementById("complaint-detail").value = "";
        document.getElementById("complaint-proof-remove")?.click();
        alert("Complaint berhasil dikirim. Admin akan menindaklanjuti keluhan anda.");
    } catch (error) {
        alert(error.message === "Failed to fetch"
            ? "Tidak bisa menghubungi backend. Pastikan server Flask berjalan di http://127.0.0.1:5000 dan sudah direstart."
            : error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    fillComplaintUser();
    setupComplaintProofUpload();
    document.getElementById("complaint-form")?.addEventListener("submit", submitComplaint);
    loadComplaintOrders();
});
