(function () {
    const API_BASE_URL = "http://127.0.0.1:5000";

    function getToken() {
        return localStorage.getItem("token");
    }

    function rupiah(value) {
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

    async function fetchDashboard() {
        const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
            headers: { "Authorization": `Bearer ${getToken()}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal memuat dashboard.");
        }
        return result.data;
    }

    function renderStats(data) {
        const stats = {
            total: data.total_orders || 0,
            processed: data.processed_orders ?? data.pending_orders ?? 0,
            done: data.selesai_orders || 0,
            revenue: rupiah(data.revenue || 0),
        };

        Object.entries(stats).forEach(([key, value]) => {
            const target = document.querySelector(`[data-stat="${key}"]`);
            if (target) target.textContent = value;
        });
    }

    function renderServiceRows(data) {
        const tbody = document.getElementById("report-table-body");
        if (!tbody) return;

        const rows = data.top_services || [];
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-gray-400 py-8">Belum ada data layanan.</td></tr>';
            return;
        }

        tbody.innerHTML = rows.map((service) => `
            <tr>
                <td>${escapeHtml(service.namaService || "-")}</td>
                <td>${Number(service.total_qty || 0)}</td>
                <td class="amount text-[#0080ff] font-bold">${rupiah(service.revenue || 0)}</td>
                <td>Data aktual</td>
            </tr>
        `).join("");
    }

    function initPeriodControls(data) {
        const tabs = document.querySelectorAll(".report-tab");
        const select = document.getElementById("period-filter-select");
        const title = document.getElementById("period-filter-title");
        const note = document.getElementById("period-filter-note");
        const exportButton = document.getElementById("export-report");

        const labels = {
            harian: "Harian",
            mingguan: "Mingguan",
            bulanan: "Bulanan",
            tahunan: "Tahunan",
        };

        function setActive(period) {
            tabs.forEach((tab) => {
                const isActive = tab.dataset.period === period;
                tab.classList.toggle("bg-[#0080ff]", isActive);
                tab.classList.toggle("text-white", isActive);
                tab.classList.toggle("shadow-sm", isActive);
                tab.classList.toggle("bg-white", !isActive);
                tab.classList.toggle("text-[#0080ff]", !isActive);
            });

            if (title) title.textContent = `Laporan ${labels[period] || "Harian"}`;
            if (note) note.textContent = "Data berikut diambil dari database saat ini.";
            if (select) {
                select.innerHTML = `<option value="all">Semua data tersedia</option>`;
            }
            if (exportButton) {
                exportButton.textContent = `Export Laporan ${labels[period] || "Harian"}`;
                exportButton.dataset.popup = `Laporan ${labels[period]?.toLowerCase() || "harian"} berdasarkan database berhasil dibuat sementara.`;
            }

            renderStats(data);
            renderServiceRows(data);
        }

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => setActive(tab.dataset.period));
        });
        setActive("harian");
    }

    async function init() {
        if (!getToken()) {
            window.location.href = "../auth/login/login.html";
            return;
        }

        const data = await fetchDashboard();
        initPeriodControls(data);
    }

    document.addEventListener("DOMContentLoaded", () => {
        init().catch((error) => alert(error.message));
    });
}());
