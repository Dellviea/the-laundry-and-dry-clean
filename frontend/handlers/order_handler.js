const BASE_URL = "http://127.0.0.1:5000";

// ── Helpers ───────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }
function getUser()  { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }

function rupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(value);
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

// ── State ─────────────────────────────────────────────────────
const orderItems = new Map();

// ── DOM refs ──────────────────────────────────────────────────
const itemParent       = document.getElementById("item");
const serviceGrid      = document.getElementById("service-grid");
const subtotalEl       = document.getElementById("subtotal");
const pickupTotalEl    = document.getElementById("pickup-total");
const grandTotalEl     = document.getElementById("grand-total");
const customEmailRadio = document.getElementById("custom-email");
const registeredEmailRadio = document.getElementById("registered-email");
const customEmailPanel = document.getElementById("custom-email-panel");
const customEmailInput = document.getElementById("custom-email-input");
const customEmailModal = document.getElementById("custom-email-modal");
const customEmailModalInput = document.getElementById("custom-email-modal-input");
const cancelCustomEmail = document.getElementById("cancel-custom-email");
const saveCustomEmail  = document.getElementById("save-custom-email");
const qrisOption       = document.getElementById("qris-option");
const qrisPayment      = document.getElementById("qris-payment");
const submitOrderButton = document.getElementById("submit-order");
const qrisModal        = document.getElementById("qris-modal");
const closeQrisModal   = document.getElementById("close-qris-modal");
const pickupAddressPanel = document.getElementById("pickup-address-panel");
const pickupAddressInput = document.getElementById("pickup-address-input");
const orderProofInput = document.getElementById("order-proof-input");
const orderProofPreview = document.getElementById("order-proof-preview");
const orderProofName = document.getElementById("order-proof-name");
const orderProofRemove = document.getElementById("order-proof-remove");

const selectedServiceClasses = ["!bg-[#c7e3ff]"];
const serviceIdBySlug = {
    "regular": 1,
    "express": 2,
    "setrika": 3,
    "jas": 4,
    "gaun": 5,
};
let hasSavedAddress = Boolean((getUser()?.alamat || "").trim());
let ironingService = null;
let orderProofPhoto = "";

function isIroningService(service) {
    const name = String(service.namaService || "").toLowerCase();
    const category = String(service.kategori || "").toLowerCase();
    return name.startsWith("setrika") || category.includes("setrika");
}

function ironingSubtotal(item) {
    return item.useIroning && ironingService ? Number(ironingService.harga || 0) * item.quantity : 0;
}

function setServiceSelected(button, selected) {
    button.classList.toggle("is-selected", selected);
    selectedServiceClasses.forEach((className) => {
        button.classList.toggle(className, selected);
    });
}

// ── Render item list ──────────────────────────────────────────
function renderItems() {
    if (!itemParent) return;
    itemParent.innerHTML = "";

    orderItems.forEach((item, id) => {
        const ironingPrice = ironingSubtotal(item);
        const row = document.createElement("div");
        row.className = "item-row min-h-[68px] border border-[#d6d6d6] rounded-lg bg-[#f7f7f7] grid grid-cols-[minmax(180px,1fr)_250px_120px] items-center gap-[18px] py-3 pr-[34px] pl-[52px]";
        row.dataset.service = id;
        row.innerHTML = `
            <div>
                <div class="item-title font-semibold text-base">${item.title}</div>
                <div class="price-text text-[#0080ff] font-bold text-xs">${rupiah(item.price)}/${item.unit || "kg"}</div>
                ${ironingService ? `
                    <label class="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-[#4b4b4b]">
                        <input type="checkbox" data-action="toggle-ironing" ${item.useIroning ? "checked" : ""}>
                        Tambah ${escapeHtml(ironingService.namaService)} (${rupiah(ironingService.harga)}/${escapeHtml(ironingService.satuan || item.unit || "kg")})
                    </label>
                ` : ""}
            </div>
            <div class="item-actions flex items-center justify-center gap-4 text-[#0080ff] font-bold text-xs">
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="minus">
                    <img src="../icon/minus.svg" alt="">
                </button>
                <span>${item.quantity} ${item.unit || "kg"}</span>
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="plus">
                    <img src="../icon/plus.svg" alt="">
                </button>
                <button class="delete-button w-[34px] h-[34px] border-0 rounded bg-[#df0000] inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="delete">
                    <img src="../icon/trash.svg" alt="">
                </button>
            </div>
            <div class="row-price text-[#0080ff] font-bold text-xs text-right">
                ${rupiah((item.price * item.quantity) + ironingPrice)}
                ${ironingPrice ? `<div class="mt-1 text-[11px] text-[#707070]">Termasuk setrika ${rupiah(ironingPrice)}</div>` : ""}
            </div>
        `;
        itemParent.appendChild(row);
    });

    updateTotals();
}

function getPickupFee() {
    const selected = document.querySelector('input[name="pickup-method"]:checked');
    return selected ? Number(selected.value) : 0;
}

function isPickupSelected() {
    return document.getElementById("pickup")?.checked;
}

function setPickupAddressVisibility() {
    const shouldShow = isPickupSelected() && !hasSavedAddress;
    pickupAddressPanel?.classList.toggle("hidden", !shouldShow);
    if (shouldShow) {
        pickupAddressInput?.setAttribute("required", "required");
    } else {
        pickupAddressInput?.removeAttribute("required");
    }
}

async function loadAccountAddress() {
    const token = getToken();
    if (!token) {
        setPickupAddressVisibility();
        return;
    }

    try {
        const response = await fetch(`${BASE_URL}/account`, {
            headers: { "Authorization": `Bearer ${token}` },
        });
        const result = await response.json();
        if (!response.ok || !result.success) {
            setPickupAddressVisibility();
            return;
        }

        const user = result.data;
        localStorage.setItem("user", JSON.stringify(user));
        hasSavedAddress = Boolean((user.alamat || "").trim());
        setPickupAddressVisibility();
    } catch (error) {
        console.warn("Alamat akun belum bisa dimuat.", error);
        setPickupAddressVisibility();
    }
}

async function savePickupAddressIfNeeded(token) {
    if (!isPickupSelected() || hasSavedAddress) return true;

    const address = pickupAddressInput?.value.trim() || "";
    if (!address) {
        alert("Isi alamat pickup terlebih dahulu.");
        pickupAddressInput?.focus();
        return false;
    }

    const response = await fetch(`${BASE_URL}/account`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ alamat: address }),
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan alamat pickup.");
    }

    localStorage.setItem("user", JSON.stringify(result.data.user));
    hasSavedAddress = true;
    setPickupAddressVisibility();
    return true;
}

function updateTotals() {
    let subtotal = 0;
    orderItems.forEach((item) => {
        subtotal += item.price * item.quantity;
        subtotal += ironingSubtotal(item);
    });

    const pickupFee = getPickupFee();
    if (subtotalEl)    subtotalEl.textContent    = rupiah(subtotal);
    if (pickupTotalEl) pickupTotalEl.textContent = pickupFee ? rupiah(pickupFee) : "Free";
    if (grandTotalEl)  grandTotalEl.textContent  = rupiah(subtotal + pickupFee);
}

async function syncServiceCardsFromBackend() {
    if (!serviceGrid) return;

    try {
        const response = await fetch(`${BASE_URL}/services`);
        const result = await response.json();
        if (!response.ok || !result.success) return;

        const services = result.data || [];
        if (services.length === 0) return;

        orderItems.clear();
        ironingService = services.find(isIroningService) || null;
        const visibleServices = services.filter((service) => !isIroningService(service));
        serviceGrid.innerHTML = `
            <span class="hidden !bg-[#c7e3ff]"></span>
            ${visibleServices.map((service) => `
                <button class="service-card min-h-[198px] border border-[#e0e0e0] rounded-lg bg-white text-[#4b4b4b] shadow-md flex flex-col items-center justify-center gap-2.5 cursor-pointer hover:-translate-y-0.5 transition [&_img]:h-[88px] [&_img]:w-[88px] [&_strong]:font-semibold [&_strong]:text-[15px]" type="button" data-service="service-${service.idService}" data-id-service="${service.idService}" data-title="${escapeHtml(service.namaService)}" data-price="${service.harga}" data-unit="${escapeHtml(service.satuan || "kg")}">
                    <img src="../image/shirt.svg" alt="">
                    <strong>${escapeHtml(service.namaService)}</strong>
                    <span class="price-text text-[#0080ff] font-bold text-xs">${rupiah(service.harga)}/${escapeHtml(service.satuan || "kg")}</span>
                </button>
            `).join("")}
        `;
        renderItems();
    } catch (error) {
        console.warn("Layanan backend belum bisa dimuat.", error);
    }
}

// ── Service grid click ────────────────────────────────────────
if (serviceGrid) {
    serviceGrid.addEventListener("click", (event) => {
        const serviceButton = event.target.closest(".service-card");
        if (!serviceButton) return;

        const id = serviceButton.dataset.service;
        if (orderItems.has(id)) {
            orderItems.delete(id);
            setServiceSelected(serviceButton, false);
        } else {
            orderItems.set(id, {
                title:    serviceButton.dataset.title,
                price:    Number(serviceButton.dataset.price),
                quantity: 1,
                idService: Number(serviceButton.dataset.idService) || null,
                unit: serviceButton.dataset.unit || "kg",
                useIroning: false,
            });
            setServiceSelected(serviceButton, true);
        }
        renderItems();
    });
}

// ── Item list actions ─────────────────────────────────────────
if (itemParent) {
    itemParent.addEventListener("click", (event) => {
        const actionButton = event.target.closest("button[data-action]");
        const row          = event.target.closest(".item-row");
        if (!actionButton || !row) return;

        const id   = row.dataset.service;
        const item = orderItems.get(id);
        if (!item) return;

        const action = actionButton.dataset.action;
        if (action === "plus")  item.quantity += 1;
        if (action === "minus" && item.quantity > 1) item.quantity -= 1;
        if (action === "delete") {
            orderItems.delete(id);
            const btn = document.querySelector(`.service-card[data-service="${id}"]`);
            if (btn) setServiceSelected(btn, false);
        }
        renderItems();
    });

    itemParent.addEventListener("change", (event) => {
        const checkbox = event.target.closest('input[data-action="toggle-ironing"]');
        const row = event.target.closest(".item-row");
        if (!checkbox || !row) return;

        const item = orderItems.get(row.dataset.service);
        if (!item) return;

        item.useIroning = checkbox.checked;
        renderItems();
    });
}

document.querySelectorAll('input[name="pickup-method"]').forEach((input) => {
    input.addEventListener("change", () => {
        updateTotals();
        setPickupAddressVisibility();
    });
});

// ── Custom email modal ────────────────────────────────────────
if (customEmailRadio) {
    customEmailRadio.addEventListener("change", () => {
        if (!customEmailRadio.checked) return;
        customEmailPanel?.classList.remove("hidden");
        customEmailPanel?.classList.add("flex");
        if (customEmailModalInput && customEmailInput)
            customEmailModalInput.value = customEmailInput.value;
        customEmailModal?.classList.remove("hidden");
        customEmailModal?.classList.add("flex");
        customEmailModalInput?.focus();
    });
}

if (registeredEmailRadio) {
    registeredEmailRadio.addEventListener("change", () => {
        customEmailPanel?.classList.add("hidden");
        customEmailPanel?.classList.remove("flex");
        customEmailModal?.classList.add("hidden");
        customEmailModal?.classList.remove("flex");
    });
}

cancelCustomEmail?.addEventListener("click", () => {
    customEmailModal?.classList.add("hidden");
    customEmailModal?.classList.remove("flex");
    if (customEmailInput && !customEmailInput.value.trim() && registeredEmailRadio) {
        registeredEmailRadio.checked = true;
        customEmailPanel?.classList.add("hidden");
        customEmailPanel?.classList.remove("flex");
    }
});

saveCustomEmail?.addEventListener("click", () => {
    const email = customEmailModalInput?.value.trim() || "";
    if (!email) {
        alert("Isi custom email terlebih dahulu.");
        customEmailModalInput?.focus();
        return;
    }
    if (customEmailInput) customEmailInput.value = email;
    customEmailModal?.classList.add("hidden");
    customEmailModal?.classList.remove("flex");
});

customEmailModal?.addEventListener("click", (e) => {
    if (e.target === customEmailModal) {
        customEmailModal.classList.add("hidden");
        customEmailModal.classList.remove("flex");
    }
});

// ── QRIS modal ────────────────────────────────────────────────
qrisOption?.addEventListener("click", () => {
    if (qrisPayment) qrisPayment.checked = true;
    qrisModal?.classList.remove("hidden");
    qrisModal?.classList.add("flex");
});

closeQrisModal?.addEventListener("click", () => {
    qrisModal?.classList.add("hidden");
    qrisModal?.classList.remove("flex");
});

qrisModal?.addEventListener("click", (e) => {
    if (e.target === qrisModal) {
        qrisModal.classList.add("hidden");
        qrisModal.classList.remove("flex");
    }
});

orderProofInput?.addEventListener("change", () => {
    const file = orderProofInput.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Bukti foto harus berupa file gambar.");
        orderProofInput.value = "";
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
        alert("Ukuran foto maksimal 2MB.");
        orderProofInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        orderProofPhoto = String(reader.result || "");
        const image = orderProofPreview?.querySelector("img");
        if (image) image.src = orderProofPhoto;
        if (orderProofName) orderProofName.textContent = file.name;
        orderProofPreview?.classList.remove("hidden");
        orderProofPreview?.classList.add("flex");
    };
    reader.readAsDataURL(file);
});

orderProofRemove?.addEventListener("click", () => {
    orderProofPhoto = "";
    if (orderProofInput) orderProofInput.value = "";
    orderProofPreview?.classList.add("hidden");
    orderProofPreview?.classList.remove("flex");
});

// ── Submit order → kirim ke backend ──────────────────────────
if (submitOrderButton) {
    submitOrderButton.addEventListener("click", async () => {
        if (orderItems.size === 0) {
            alert("Pilih minimal satu layanan sebelum submit pemesanan.");
            return;
        }

        if (customEmailRadio?.checked && customEmailInput && !customEmailInput.value.trim()) {
            alert("Isi custom email terlebih dahulu.");
            customEmailInput.focus();
            return;
        }

        const token = getToken();
        if (!token) {
            alert("Silakan login terlebih dahulu.");
            window.location.href = '../auth/login/login.html';
            return;
        }

        // Susun payload
        const pickupEl = document.querySelector('input[name="pickup-method"]:checked');
        const metodePengambilan = pickupEl?.id === "pickup" ? "Pickup" : "Self";
        const metodePembayaran = qrisPayment?.checked ? "QRIS" : "Cash";
        const biayaPengambilan = getPickupFee();

        const items = [];
        orderItems.forEach((item, id) => {
            items.push({
                idService: item.idService || serviceIdBySlug[id] || 1,
                quantity:  item.quantity,
            });
            if (item.useIroning && ironingService) {
                items.push({
                    idService: Number(ironingService.idService),
                    quantity: item.quantity,
                });
            }
        });

        const notifEmail = customEmailRadio?.checked
            ? customEmailInput?.value.trim()
            : getUser()?.email || "";
        localStorage.setItem("last_order_email", notifEmail);

        try {
            const addressReady = await savePickupAddressIfNeeded(token);
            if (!addressReady) return;

            const res  = await fetch(`${BASE_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items,
                    metodePengambilan,
                    metodePembayaran,
                    biayaPengambilan,
                    buktiFoto: orderProofPhoto,
                    catatan:            document.getElementById("catatan")?.value || "",
                    notification_email: notifEmail,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                const order = data.data || {};
                const invoiceUrl = order.payment?.xendit_invoice_url;

                if (metodePembayaran === "QRIS") {
                    if (!invoiceUrl) {
                        alert("Payment link Xendit belum tersedia. Coba ulangi pemesanan.");
                        return;
                    }

                    sessionStorage.setItem("pendingXenditPayment", JSON.stringify({
                        orderId: order.idOrder,
                        invoiceUrl,
                    }));
                    window.location.href = `payment.html?order_id=${order.idOrder}`;
                    return;
                }

                if (window.showAppNotification) {
                    window.showAppNotification("Pemesanan berhasil dibuat!", () => {
                        window.location.href = "riwayat-pemesanan.html";
                    });
                } else {
                    window.location.href = "riwayat-pemesanan.html";
                }
            } else {
                alert(data.message || "Gagal membuat pesanan.");
            }
        } catch (err) {
            alert(err.message || "Tidak bisa connect ke backend!");
            console.error(err);
        }
    });
}

syncServiceCardsFromBackend();
loadAccountAddress();
setPickupAddressVisibility();
renderItems();
