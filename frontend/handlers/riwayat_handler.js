const BASE_URL = "http://127.0.0.1:5000";
const HISTORY_PAGE_SIZE = 4;

let allHistoryOrders = [];
let currentHistoryPage = 1;

function getToken() { return localStorage.getItem("token"); }

function rupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(value);
}

function statusLabel(status) {
    const map = {
        "DIPESAN":  { text: "Dipesan",         color: "bg-[#9d9823]" },
        "DIJEMPUT": { text: "Dijemput",         color: "bg-[#2596a5]" },
        "DIANTAR":  { text: "Diantar",          color: "bg-[#2596a5]" },
        "DICUCI":   { text: "Sedang Dicuci",    color: "bg-[#2596a5]" },
        "DIKIRIM":  { text: "Selesai",          color: "bg-[#1a7a3c]" },
        "SELESAI":  { text: "Selesai",          color: "bg-[#1a7a3c]" },
        "DIBATALKAN": { text: "Dibatalkan",     color: "bg-[#df0000]" },
    };
    return map[status] || { text: status, color: "bg-gray-400" };
}

function formatTanggal(dateStr) {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { weekday:"long", day:"numeric", month:"long", year:"numeric" });
}

function getSelectedStatuses() {
    return Array.from(document.querySelectorAll("[data-status-filter]:checked"))
        .map((input) => input.dataset.statusFilter);
}

function getSortDirection() {
    return document.querySelector('input[name="sort"]:checked')?.value || "desc";
}

function statusMatches(order, selected) {
    if (selected.length === 0) return true;
    if (selected.includes(order.status)) return true;
    return selected.includes("PROCESS") && ["DIJEMPUT", "DIANTAR", "DICUCI", "DIKIRIM"].includes(order.status);
}

function dateValue(order) {
    return order.tanggal ? new Date(order.tanggal).getTime() : 0;
}

function getFilteredOrders() {
    const selectedStatuses = getSelectedStatuses();
    const sortDirection = getSortDirection();

    return allHistoryOrders
        .filter((order) => statusMatches(order, selectedStatuses))
        .sort((a, b) => {
            const diff = dateValue(a) - dateValue(b);
            return sortDirection === "asc" ? diff : -diff;
        });
}

function currentPageOrders(orders) {
    const start = (currentHistoryPage - 1) * HISTORY_PAGE_SIZE;
    return orders.slice(start, start + HISTORY_PAGE_SIZE);
}

function renderHistoryPagination(totalItems) {
    const pagination = document.querySelector(".pagination");
    if (!pagination) return;

    const totalPages = Math.ceil(totalItems / HISTORY_PAGE_SIZE);
    if (totalPages <= 1) {
        pagination.innerHTML = "";
        pagination.classList.add("hidden");
        return;
    }

    pagination.classList.remove("hidden");
    pagination.innerHTML = Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        const active = page === currentHistoryPage ? "is-active !bg-[#0080ff] !border-white" : "";
        return `<button class="page-number w-8 h-8 rounded-lg border-0 bg-[#d2d2d2] text-white font-bold cursor-pointer ${active}" type="button" data-history-page="${page}">${page}</button>`;
    }).join("");

    pagination.querySelectorAll("[data-history-page]").forEach((button) => {
        button.addEventListener("click", () => {
            currentHistoryPage = Number(button.dataset.historyPage);
            renderHistory();
        });
    });
}

function renderHistory() {
    const filteredOrders = getFilteredOrders();
    const maxPage = Math.max(1, Math.ceil(filteredOrders.length / HISTORY_PAGE_SIZE));
    if (currentHistoryPage > maxPage) currentHistoryPage = maxPage;

    renderOrders(currentPageOrders(filteredOrders));
    renderHistoryPagination(filteredOrders.length);
}

function renderOrders(orders) {
    const container = document.querySelector(".history-list");
    if (!container) return;

    if (!orders || orders.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-400 py-10">Belum ada pesanan.</p>`;
        renderHistoryPagination(0);
        return;
    }

    container.innerHTML = orders.map(order => {
        const status   = statusLabel(order.status);
        const items    = order.items || [];
        const payment  = order.payment || {};
        const totalItems = items.length;

        const itemsHTML = items.map(item =>
            `<div class="history-line grid grid-cols-[minmax(160px,1fr)_130px_130px] gap-3 text-sm mb-2.5">
                <span>${item.namaService}</span>
                <span class="qty text-[#0080ff] font-bold">${item.quantity} ${item.satuan || "kg"}</span>
                <span class="amount text-[#0080ff] font-bold">${rupiah(item.subtotal)}</span>
            </div>`
        ).join("");

        return `
        <article class="history-card border border-[#e2e2e2] rounded-lg shadow-md pt-5 px-4 pb-4">
            <div class="history-head flex items-start justify-between gap-[18px] mb-[18px]">
                <div class="history-title flex items-start gap-4 [&_img]:h-[42px] [&_img]:w-[42px]">
                    <img src="../image/shirt.svg" alt="">
                    <div>
                        <div class="history-date font-semibold text-[15px]">${formatTanggal(order.tanggal)}</div>
                        <div class="price-text text-[#0080ff] font-bold text-xs">Order #${order.idOrder} - ${totalItems} layanan</div>
                    </div>
                </div>
                <span class="status-pill min-w-[142px] h-8 rounded-lg text-white font-bold text-sm flex items-center justify-center shadow-md ${status.color}">
                    ${status.text}
                </span>
            </div>
            <div class="history-summary bg-[#f7f7f7] rounded-lg py-[18px] px-7">
                ${itemsHTML}
                <hr class="summary-rule border-0 border-t-2 border-[#0080ff] mt-0.5 mb-[18px]">
                <div class="history-line grid grid-cols-[minmax(160px,1fr)_130px_130px] gap-3 text-sm mb-2.5">
                    <strong>Total</strong>
                    <span></span>
                    <span class="amount text-[#0080ff] font-bold">${rupiah(order.total)}</span>
                </div>
                <div class="history-line grid grid-cols-[minmax(160px,1fr)_130px_130px] gap-3 text-sm">
                    <span>Metode Bayar</span>
                    <span></span>
                    <span class="text-[#0080ff] font-bold">${payment.metode || "-"} 
                        <span class="${payment.status === 'PAID' ? 'text-green-600' : 'text-red-500'}">(${payment.status || "-"})</span>
                    </span>
                </div>
            </div>
        </article>`;
    }).join("");
}

async function loadRiwayat() {
    const token = getToken();
    if (!token) {
        alert("Silakan login terlebih dahulu.");
        window.location.href = '../auth/login/login.html';
        return;
    }

    try {
        const res  = await fetch(`${BASE_URL}/orders/history`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();

        if (res.ok) {
            allHistoryOrders = data.data.orders || data.data || [];
            currentHistoryPage = 1;
            renderHistory();
        } else {
            alert(data.message || "Gagal memuat riwayat.");
        }
    } catch (err) {
        alert("Tidak bisa connect ke backend!");
        console.error(err);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("[data-status-filter], input[name='sort']").forEach((input) => {
        input.addEventListener("change", () => {
            currentHistoryPage = 1;
            renderHistory();
        });
    });
    loadRiwayat();
});
