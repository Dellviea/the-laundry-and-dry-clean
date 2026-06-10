const REVIEW_API_BASE_URL = "http://127.0.0.1:5000";

function getReviewToken() {
    return localStorage.getItem("token");
}

function reviewRupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(value || 0);
}

function reviewDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function orderLabel(order) {
    const items = (order.items || []).map((item) => item.namaService).join(", ");
    return `ORD-${order.idOrder} - ${reviewDate(order.tanggal)} - ${items || reviewRupiah(order.total)}`;
}

async function loadReviewOrders() {
    const token = getReviewToken();
    if (!token) {
        window.location.href = "../auth/login/login.html";
        return;
    }

    try {
        const response = await fetch(`${REVIEW_API_BASE_URL}/orders/history`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat pesanan.");
        }

        const orders = result.data.orders || [];
        const selectable = orders.filter((order) => order.status === "SELESAI");
        const reviewOrder = document.getElementById("review-order");
        if (!reviewOrder) return;

        const list = selectable.length > 0 ? selectable : orders;
        reviewOrder.innerHTML = list.map((order) => (
            `<option value="${order.idOrder}">${orderLabel(order)}</option>`
        )).join("");

        if (list.length === 0) {
            reviewOrder.innerHTML = '<option value="">Belum ada pesanan</option>';
        }
    } catch (error) {
        alert(error.message);
    }
}

async function submitReview(event) {
    event.preventDefault();

    const token = getReviewToken();
    const orderId = document.getElementById("review-order").value;
    const rating = Number(document.getElementById("review-rating").value);
    const komentar = document.getElementById("review-message").value.trim();

    if (!orderId) {
        alert("Pilih pesanan terlebih dahulu.");
        return;
    }

    try {
        const response = await fetch(`${REVIEW_API_BASE_URL}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ idOrder: Number(orderId), rating, komentar }),
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengirim review.");
        }

        document.getElementById("review-message").value = "";
        alert("Review berhasil dikirim.");
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("review-form")?.addEventListener("submit", submitReview);
    loadReviewOrders();
});
