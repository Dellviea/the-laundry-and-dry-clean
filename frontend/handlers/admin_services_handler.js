(function () {
    const API_BASE_URL = "http://127.0.0.1:5000";
    let services = [];
    let activeServiceId = null;

    function getToken() {
        return localStorage.getItem("token");
    }

    function headers() {
        return {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`,
        };
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

    async function api(path, options = {}) {
        const response = await fetch(`${API_BASE_URL}${path}`, options);
        const result = await response.json();
        if (!response.ok || !result.success) {
            throw new Error(result.message || "Request layanan gagal.");
        }
        return result.data;
    }

    function renderServices() {
        const tbody = document.getElementById("service-table-body");
        if (!tbody) return;

        if (!services.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-400 py-8">Belum ada layanan.</td></tr>';
            return;
        }

        tbody.innerHTML = services.map((service) => `
            <tr>
                <td>${escapeHtml(service.namaService)}</td>
                <td class="amount text-[#0080ff] font-bold">${rupiah(service.harga)}</td>
                <td>${escapeHtml(service.satuan || "kg")}</td>
                <td>${escapeHtml(service.kategori || "-")}</td>
                <td class="admin-table-actions flex gap-2 flex-wrap">
                    <button class="admin-mini-action h-9 border border-[#0080ff] rounded-lg bg-white text-[#0080ff] font-bold px-4 cursor-pointer" type="button" data-edit-service="${service.idService}">Edit</button>
                    <button class="admin-mini-action h-9 border border-[#df0000] rounded-lg bg-white text-[#df0000] font-bold px-4 cursor-pointer" type="button" data-delete-service="${service.idService}">Hapus</button>
                </td>
            </tr>
        `).join("");
    }

    async function loadServices() {
        services = await api("/services");
        renderServices();
    }

    function openModal(service) {
        activeServiceId = service.idService;
        document.getElementById("edit-service-name").value = service.namaService || "";
        document.getElementById("edit-service-price").value = service.harga || "";
        document.getElementById("edit-service-unit").value = service.satuan || "kg";
        document.getElementById("edit-service-category").value = service.kategori || "Reguler";
        document.getElementById("service-edit-modal").classList.remove("hidden");
        document.getElementById("service-edit-modal").classList.add("flex");
    }

    function closeModal() {
        activeServiceId = null;
        document.getElementById("service-edit-modal").classList.add("hidden");
        document.getElementById("service-edit-modal").classList.remove("flex");
    }

    async function createService(event) {
        event.preventDefault();
        event.stopImmediatePropagation();

        const payload = {
            namaService: document.getElementById("service-name").value.trim(),
            harga: Number(document.getElementById("service-price").value.replace(/[^\d]/g, "")),
            satuan: document.getElementById("service-unit").value,
            kategori: document.getElementById("service-category").value,
            isRecommended: false,
        };

        await api("/admin/services", {
            method: "POST",
            headers: headers(),
            body: JSON.stringify(payload),
        });

        event.target.reset();
        alert("Layanan berhasil ditambahkan.");
        await loadServices();
    }

    async function updateService(event) {
        event.preventDefault();
        if (!activeServiceId) return;

        const payload = {
            namaService: document.getElementById("edit-service-name").value.trim(),
            harga: Number(document.getElementById("edit-service-price").value.replace(/[^\d]/g, "")),
            satuan: document.getElementById("edit-service-unit").value,
            kategori: document.getElementById("edit-service-category").value,
        };

        await api(`/admin/services/${activeServiceId}`, {
            method: "PUT",
            headers: headers(),
            body: JSON.stringify(payload),
        });

        closeModal();
        alert("Layanan berhasil diperbarui.");
        await loadServices();
    }

    async function deleteService(serviceId) {
        if (!confirm("Hapus layanan ini?")) return;

        await api(`/admin/services/${serviceId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${getToken()}` },
        });

        alert("Layanan berhasil dihapus.");
        await loadServices();
    }

    function bindEvents() {
        document.getElementById("service-create-form")?.addEventListener("submit", (event) => {
            createService(event).catch((error) => alert(error.message));
        }, true);

        document.getElementById("service-edit-form")?.addEventListener("submit", (event) => {
            updateService(event).catch((error) => alert(error.message));
        });

        document.getElementById("service-table-body")?.addEventListener("click", (event) => {
            const editButton = event.target.closest("[data-edit-service]");
            if (editButton) {
                const service = services.find((item) => String(item.idService) === String(editButton.dataset.editService));
                if (service) openModal(service);
                return;
            }

            const deleteButton = event.target.closest("[data-delete-service]");
            if (deleteButton) {
                deleteService(deleteButton.dataset.deleteService).catch((error) => alert(error.message));
            }
        });

        document.getElementById("close-service-modal")?.addEventListener("click", closeModal);
        document.getElementById("cancel-service-edit")?.addEventListener("click", closeModal);
        document.getElementById("service-edit-modal")?.addEventListener("click", (event) => {
            if (event.target.id === "service-edit-modal") closeModal();
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        if (!getToken()) {
            window.location.href = "../auth/login/login.html";
            return;
        }
        bindEvents();
        loadServices().catch((error) => alert(error.message));
    });
}());
