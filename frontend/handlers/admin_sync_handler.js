const ADMIN_API_BASE_URL = "http://127.0.0.1:5000";
const ADMIN_PAGE_SIZE = 5;

let adminOrdersCache = [];
let adminReviewsCache = [];
let adminCurrentPage = 1;
let activeOrderPhoto = "";
const complaintPhotos = new Map();

function getAdminToken() {
    return localStorage.getItem("token");
}

function adminHeaders() {
    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${getAdminToken()}`,
    };
}

function ensureAdminSession() {
    if (!getAdminToken()) {
        alert("Silakan login sebagai admin terlebih dahulu.");
        window.location.href = "../auth/login/login.html";
        return false;
    }
    return true;
}

function adminRupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(Number(value || 0));
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

function orderCode(orderId) {
    return `ORD-${String(orderId).padStart(6, "0")}`;
}

function orderItemsText(order) {
    const items = order.items || [];
    if (items.length === 0) return "-";
    return items.map((item) => item.namaService).join(", ");
}

function statusMeta(status) {
    const map = {
        DIPESAN: { label: "Dipesan", color: "bg-[#9d9823]" },
        DIJEMPUT: { label: "Dijemput", color: "bg-[#2596a5]" },
        DIANTAR: { label: "Diantar", color: "bg-[#2596a5]" },
        DICUCI: { label: "Dicuci", color: "bg-[#2596a5]" },
        DIKIRIM: { label: "Dikirim", color: "bg-[#2596a5]" },
        SELESAI: { label: "Selesai", color: "bg-[#219425]" },
        DIBATALKAN: { label: "Dibatalkan", color: "bg-[#df0000]" },
    };
    return map[status] || { label: status || "-", color: "bg-gray-400" };
}

function statusPill(status) {
    const meta = statusMeta(status);
    return `<span class="admin-status inline-flex min-w-28 h-7 rounded-lg items-center justify-center text-white font-bold text-xs ${meta.color}">${meta.label}</span>`;
}

async function adminFetch(path, options = {}) {
    const response = await fetch(`${ADMIN_API_BASE_URL}${path}`, options);
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "Request admin gagal.");
    }
    return result.data;
}

async function fetchAdminOrders(query = "") {
    return adminFetch(`/admin/orders${query}`, {
        headers: { "Authorization": `Bearer ${getAdminToken()}` },
    });
}

async function updateOrderStatus(orderId, status) {
    return adminFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify({ status }),
    });
}

function renderAdminPagination(totalItems, onPageChange) {
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

    const totalPages = Math.max(1, Math.ceil(totalItems / ADMIN_PAGE_SIZE));
    pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const active = page === adminCurrentPage ? "is-active !bg-[#0080ff] !border-white" : "";
        return `<button class="page-number w-8 h-8 rounded-lg border-0 bg-[#d2d2d2] text-white font-bold cursor-pointer ${active}" type="button" data-admin-page="${page}">${page}</button>`;
    }).join("");

    pagination.querySelectorAll("[data-admin-page]").forEach((button) => {
        button.addEventListener("click", () => {
            adminCurrentPage = Number(button.dataset.adminPage);
            onPageChange();
        });
    });
}

function currentPageItems(items) {
    const start = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
    return items.slice(start, start + ADMIN_PAGE_SIZE);
}

function renderOrdersPage() {
    const tbody = document.querySelector(".admin-table tbody");
    if (!tbody) return;

    const visible = currentPageItems(adminOrdersCache);
    if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-gray-400 py-8">Belum ada pesanan.</td></tr>';
        renderAdminPagination(0, renderOrdersPage);
        return;
    }

    tbody.innerHTML = visible.map((order) => `
        <tr>
            <td>${orderCode(order.idOrder)}</td>
            <td>${escapeHtml(order.nama || "-")}</td>
            <td>${escapeHtml(orderItemsText(order))}</td>
            <td class="amount text-[#0080ff] font-bold">${adminRupiah(order.total)}</td>
            <td>${statusPill(order.status)}</td>
            <td class="admin-table-actions flex gap-2 flex-wrap">
                <button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" onclick="window.location.href='order-detail.html?order_id=${order.idOrder}'">Detail</button>
                <button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" onclick="window.location.href='status.html?order_id=${order.idOrder}'">Ubah Status</button>
            </td>
        </tr>
    `).join("");

    renderAdminPagination(adminOrdersCache.length, renderOrdersPage);
}

async function initOrdersPage() {
    adminOrdersCache = await fetchAdminOrders();
    adminCurrentPage = 1;
    renderOrdersPage();
}

function nextApproveStatus(order) {
    if (order.status !== "DIPESAN") return null;
    const paymentMethod = (order.payment?.metode || "").toLowerCase();
    if (paymentMethod === "cash" || order.metodePengambilan === "Self") return "DIANTAR";
    return order.metodePengambilan === "Pickup" ? "DIJEMPUT" : "DIANTAR";
}

function renderApprovalPage() {
    const tbody = document.querySelector(".admin-table tbody");
    if (!tbody) return;

    const pendingOrders = adminOrdersCache.filter((order) => order.status === "DIPESAN");
    const visible = currentPageItems(pendingOrders);
    if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8">Tidak ada order yang menunggu approval.</td></tr>';
        renderAdminPagination(0, renderApprovalPage);
        return;
    }

    tbody.innerHTML = visible.map((order) => `
        <tr>
            <td>${orderCode(order.idOrder)}</td>
            <td>${escapeHtml(order.nama || "-")}</td>
            <td class="amount text-[#0080ff] font-bold">${adminRupiah(order.total)}</td>
            <td>${statusPill(order.status)}</td>
            <td class="admin-table-actions flex gap-2 flex-wrap">
                <button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" data-admin-update-status="${nextApproveStatus(order)}" data-order-id="${order.idOrder}">Approve</button>
                <button class="admin-mini-action h-9 border border-[#df0000] rounded-lg bg-white text-[#df0000] font-bold px-4 cursor-pointer" type="button" data-admin-update-status="DIBATALKAN" data-order-id="${order.idOrder}">Tolak</button>
            </td>
        </tr>
    `).join("");

    renderAdminPagination(pendingOrders.length, renderApprovalPage);
}

async function initApprovalPage() {
    adminOrdersCache = await fetchAdminOrders();
    adminCurrentPage = 1;
    renderApprovalPage();
}

function renderDeliveryPage() {
    const tbody = document.querySelector(".admin-table tbody");
    if (!tbody) return;

    const deliveryOrders = adminOrdersCache.filter((order) => order.status === "DICUCI");
    const visible = currentPageItems(deliveryOrders);
    if (visible.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8">Belum ada pesanan yang siap dikonfirmasi selesai.</td></tr>';
        renderAdminPagination(0, renderDeliveryPage);
        return;
    }

    tbody.innerHTML = visible.map((order) => `
        <tr>
            <td>${orderCode(order.idOrder)}</td>
            <td>${escapeHtml(order.nama || "-")}</td>
            <td>${escapeHtml(order.alamat || "-")}</td>
            <td>${escapeHtml(order.metodePengambilan || "-")}</td>
            <td>
                <div class="admin-table-actions flex flex-nowrap gap-2">
                    <button class="admin-mini-action h-9 whitespace-nowrap border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" data-admin-update-status="SELESAI" data-order-id="${order.idOrder}">Confirm</button>
                    <button class="admin-mini-action h-9 whitespace-nowrap border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" data-popup="Jadwal ${orderCode(order.idOrder)} dapat diubah setelah field jadwal backend tersedia.">Reschedule</button>
                </div>
            </td>
        </tr>
    `).join("");

    renderAdminPagination(deliveryOrders.length, renderDeliveryPage);
}

async function initDeliveryPage() {
    adminOrdersCache = await fetchAdminOrders();
    adminCurrentPage = 1;
    renderDeliveryPage();
}

function allowedNextStatuses(order) {
    if (!order) return [];
    if (order.status === "DIPESAN") {
        const paymentMethod = (order.payment?.metode || "").toLowerCase();
        return paymentMethod === "cash" || order.metodePengambilan === "Self"
            ? [["DIANTAR", "Diantar"], ["DIBATALKAN", "Dibatalkan"]]
            : [["DIJEMPUT", "Dijemput"], ["DIBATALKAN", "Dibatalkan"]];
    }
    if (order.status === "DIJEMPUT") return [["DICUCI", "Dicuci"]];
    if (order.status === "DIANTAR") return [["DICUCI", "Dicuci"]];
    if (order.status === "DICUCI") return [["SELESAI", "Selesai"]];
    return [];
}

function renderStatusControls() {
    const orderSelect = document.getElementById("status-order");
    const statusSelect = document.getElementById("status-next");
    if (!orderSelect || !statusSelect) return;

    const urlOrderId = new URLSearchParams(window.location.search).get("order_id");
    orderSelect.innerHTML = adminOrdersCache.map((order) => (
        `<option value="${order.idOrder}" ${String(order.idOrder) === String(urlOrderId) ? "selected" : ""}>${orderCode(order.idOrder)} - ${escapeHtml(order.nama || "-")} - ${statusMeta(order.status).label}</option>`
    )).join("");

    function updateNextOptions() {
        const selected = adminOrdersCache.find((order) => String(order.idOrder) === String(orderSelect.value));
        const next = allowedNextStatuses(selected);
        statusSelect.innerHTML = next.length
            ? next.map(([value, label]) => `<option value="${value}">${label}</option>`).join("")
            : '<option value="">Tidak ada status lanjutan</option>';
    }

    orderSelect.addEventListener("change", updateNextOptions);
    updateNextOptions();
}

function renderStatusTable() {
    const tbody = document.querySelector(".admin-table tbody");
    if (!tbody) return;

    const activeOrders = adminOrdersCache.filter((order) => !["SELESAI", "DIBATALKAN"].includes(order.status));
    tbody.innerHTML = activeOrders.map((order) => {
        const next = allowedNextStatuses(order)[0];
        return `
            <tr>
                <td>${orderCode(order.idOrder)}</td>
                <td>${escapeHtml(order.nama || "-")}</td>
                <td>${statusPill(order.status)}</td>
                <td>${next ? `<button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" data-admin-update-status="${next[0]}" data-order-id="${order.idOrder}">${next[1]}</button>` : "-"}</td>
            </tr>
        `;
    }).join("") || '<tr><td colspan="4" class="text-center text-gray-400 py-8">Tidak ada pesanan aktif.</td></tr>';
}

function showOrderPhotoPreview(src) {
    let modal = document.getElementById("order-photo-preview-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "order-photo-preview-modal";
        modal.className = "fixed inset-0 z-[80] hidden items-center justify-center bg-black/70 px-5 py-8";
        modal.innerHTML = `
            <div class="relative flex max-h-[90vh] w-full max-w-5xl flex-col rounded-lg bg-white p-4 shadow-xl">
                <button id="close-order-photo-preview" class="absolute right-4 top-4 h-10 w-10 rounded-lg border border-[#0080ff] bg-white text-xl font-bold text-[#0080ff] cursor-pointer" type="button" aria-label="Tutup">x</button>
                <h3 class="mb-4 pr-12 text-xl font-bold text-[#4b4b4b]">Preview Bukti Foto</h3>
                <img id="order-photo-preview-image" class="max-h-[78vh] w-full rounded-lg object-contain bg-[#f7f7f7]" alt="Bukti foto pesanan">
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener("click", (event) => {
            if (event.target === modal || event.target.id === "close-order-photo-preview") {
                modal.classList.add("hidden");
                modal.classList.remove("flex");
            }
        });
    }

    const image = document.getElementById("order-photo-preview-image");
    if (image) image.src = src;
    modal.classList.remove("hidden");
    modal.classList.add("flex");
}

async function initStatusPage() {
    adminOrdersCache = await fetchAdminOrders();
    renderStatusControls();
    renderStatusTable();

    document.getElementById("status-form")?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const orderId = document.getElementById("status-order").value;
        const status = document.getElementById("status-next").value;
        if (!orderId || !status) {
            alert("Pilih pesanan dan status baru terlebih dahulu.");
            return;
        }
        await updateOrderStatus(orderId, status);
        alert("Status pesanan berhasil diperbarui.");
        await initStatusPage();
    });
}

async function initOrderDetailPage() {
    const orderId = new URLSearchParams(window.location.search).get("order_id");
    if (!orderId) {
        alert("ID pesanan tidak ditemukan.");
        window.location.href = "orders.html";
        return;
    }

    const order = await adminFetch(`/admin/orders/${orderId}`, {
        headers: { "Authorization": `Bearer ${getAdminToken()}` },
    });

    const detailGrid = document.querySelector(".detail-grid");
    activeOrderPhoto = order.buktiFoto || "";
    if (detailGrid) {
        detailGrid.innerHTML = `
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>ID Pesanan</strong>${orderCode(order.idOrder)}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Customer</strong>${escapeHtml(order.nama || "-")}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Kontak</strong>${escapeHtml(order.email || "-")}<br>${escapeHtml(order.noHP || "-")}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Alamat</strong>${escapeHtml(order.alamat || "-")}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Status</strong>${statusPill(order.status)}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Pembayaran</strong>${escapeHtml(order.payment?.metode || "-")} - ${escapeHtml(order.payment?.status || "-")}</div>
            <div class="detail-box bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg p-[18px] [&_strong]:block [&_strong]:font-bold [&_strong]:mb-2"><strong>Bukti Foto</strong>${activeOrderPhoto ? '<button id="preview-order-photo" class="h-9 rounded-lg border border-[#0080ff] bg-white px-4 font-bold text-[#0080ff] cursor-pointer" type="button">Lihat Foto</button>' : 'Tidak ada bukti foto'}</div>
        `;
    }

    const tbody = document.querySelector(".admin-table tbody");
    if (tbody) {
        tbody.innerHTML = (order.items || []).map((item) => `
            <tr><td>${escapeHtml(item.namaService)}</td><td>${item.quantity} ${escapeHtml(item.satuan || "kg")}</td><td class="amount text-[#0080ff] font-bold">${adminRupiah(item.subtotal)}</td></tr>
        `).join("") + `<tr><td><strong>Total</strong></td><td></td><td class="amount text-[#0080ff] font-bold">${adminRupiah(order.total)}</td></tr>`;
    }

    document.querySelectorAll("button").forEach((button) => {
        if (button.textContent.trim() === "Update Status") {
            button.onclick = () => { window.location.href = `status.html?order_id=${order.idOrder}`; };
        }
    });
    document.getElementById("preview-order-photo")?.addEventListener("click", () => {
        if (activeOrderPhoto) showOrderPhotoPreview(activeOrderPhoto);
    });
}

function renderAdminReviews(reviews) {
    const list = document.querySelector(".admin-review-list");
    if (!list) return;
    const visible = currentPageItems(reviews);
    if (!visible.length) {
        list.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada review.</p>';
        renderAdminPagination(0, () => renderAdminReviews(adminReviewsCache));
        return;
    }
    list.innerHTML = visible.map((review) => `
        <article class="admin-review-row grid grid-cols-[52px_minmax(0,1fr)_auto] gap-4 items-center bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg py-4 px-[18px]">
            <div class="admin-avatar w-11 h-11 rounded-full bg-[#d8ebff] text-[#0080ff] font-bold flex items-center justify-center">${escapeHtml((review.nama || "?").charAt(0).toUpperCase())}</div>
            <div>
                <div class="admin-row-title font-bold mb-1">${escapeHtml(review.nama || "-")} - ${orderCode(review.idOrder)}</div>
                <div class="admin-row-copy text-sm leading-snug">Rating ${review.rating}/5 - ${escapeHtml(review.komentar || "-")}</div>
            </div>
        </article>
    `).join("");
    renderAdminPagination(reviews.length, () => renderAdminReviews(adminReviewsCache));
}

async function initReviewsPage() {
    const data = await adminFetch("/admin/reviews", {
        headers: { "Authorization": `Bearer ${getAdminToken()}` },
    });
    adminReviewsCache = data.reviews || [];
    adminCurrentPage = 1;
    renderAdminReviews(adminReviewsCache);
}

function renderAdminComplaints(complaints) {
    const list = document.querySelector(".admin-complaint-list");
    if (!list) return;
    complaintPhotos.clear();
    if (!complaints.length) {
        list.innerHTML = '<p class="text-center text-gray-400 py-8">Belum ada complaint.</p>';
        return;
    }
    list.innerHTML = complaints.map((complaint) => {
        const done = complaint.status === "SELESAI";
        const statusClasses = done
            ? "border-[#1a7a3c] bg-[#e9f7ee] text-[#1a7a3c]"
            : "border-[#df0000] bg-white text-[#df0000]";
        if (complaint.buktiFoto) {
            complaintPhotos.set(String(complaint.idComplaint), complaint.buktiFoto);
        }
        return `
            <article class="admin-complaint-row grid grid-cols-[52px_minmax(0,1fr)_150px] gap-4 items-center bg-[#f7f7f7] border border-[#e0e0e0] rounded-lg py-4 px-[18px]">
                <div class="admin-avatar w-11 h-11 rounded-full bg-[#d8ebff] text-[#0080ff] font-bold flex items-center justify-center">${escapeHtml((complaint.nama || "?").charAt(0).toUpperCase())}</div>
                <div>
                    <div class="admin-row-title font-bold mb-1">${escapeHtml(complaint.nama || "-")} - ${complaint.idOrder ? orderCode(complaint.idOrder) : "Tanpa Order"}</div>
                    <div class="admin-row-copy text-sm leading-snug">${escapeHtml(complaint.jenisKeluhan)}: ${escapeHtml(complaint.keluhan)}</div>
                    ${complaint.buktiFoto ? `<button class="mt-2 h-9 rounded-lg border border-[#0080ff] bg-white px-4 text-sm font-bold text-[#0080ff] cursor-pointer" type="button" data-preview-complaint-photo="${complaint.idComplaint}">Lihat Foto</button>` : ""}
                </div>
                <button class="complaint-status-toggle justify-self-end inline-flex min-w-[142px] cursor-pointer items-center justify-center rounded-lg border px-3 py-2 text-sm font-bold ${statusClasses}" type="button" data-complaint-id="${complaint.idComplaint}" data-complaint-next="${done ? "DIPROSES" : "SELESAI"}">${done ? "Selesai" : "Tandai Selesai"}</button>
            </article>
        `;
    }).join("");
}

async function initComplaintsPage() {
    const data = await adminFetch("/admin/complaints", {
        headers: { "Authorization": `Bearer ${getAdminToken()}` },
    });
    renderAdminComplaints(data.complaints || []);
}

async function handleAdminClick(event) {
    const statusButton = event.target.closest("[data-admin-update-status]");
    if (statusButton) {
        const orderId = statusButton.dataset.orderId;
        const status = statusButton.dataset.adminUpdateStatus;
        if (!status) return;
        await updateOrderStatus(orderId, status);
        alert("Status pesanan berhasil diperbarui.");
        window.location.reload();
        return;
    }

    const complaintPhotoButton = event.target.closest("[data-preview-complaint-photo]");
    if (complaintPhotoButton) {
        const photo = complaintPhotos.get(String(complaintPhotoButton.dataset.previewComplaintPhoto));
        if (photo) showOrderPhotoPreview(photo);
        return;
    }

    const complaintButton = event.target.closest("[data-complaint-id]");
    if (complaintButton) {
        await adminFetch(`/admin/complaints/${complaintButton.dataset.complaintId}`, {
            method: "PATCH",
            headers: adminHeaders(),
            body: JSON.stringify({ status: complaintButton.dataset.complaintNext }),
        });
        alert("Status complaint berhasil diperbarui.");
        await initComplaintsPage();
    }
}

async function initAdminSync() {
    if (!ensureAdminSession()) return;

    document.addEventListener("click", (event) => {
        handleAdminClick(event).catch((error) => alert(error.message));
    });

    const path = window.location.pathname;
    try {
        if (path.endsWith("/orders.html")) await initOrdersPage();
        if (path.endsWith("/approval.html")) await initApprovalPage();
        if (path.endsWith("/delivery.html")) await initDeliveryPage();
        if (path.endsWith("/status.html")) await initStatusPage();
        if (path.endsWith("/order-detail.html")) await initOrderDetailPage();
        if (path.endsWith("/reviews.html")) await initReviewsPage();
        if (path.endsWith("/complaints.html")) await initComplaintsPage();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("DOMContentLoaded", initAdminSync);
