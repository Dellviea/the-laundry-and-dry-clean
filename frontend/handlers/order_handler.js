const BASE_URL = "http://127.0.0.1:5000";

// ── Helpers ───────────────────────────────────────────────────
function getToken() { return localStorage.getItem("token"); }
function getUser()  { const u = localStorage.getItem("user"); return u ? JSON.parse(u) : null; }

function rupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(value);
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

const selectedServiceClasses = ["!bg-[#c7e3ff]"];

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
        const row = document.createElement("div");
        row.className = "item-row min-h-[68px] border border-[#d6d6d6] rounded-lg bg-[#f7f7f7] grid grid-cols-[minmax(180px,1fr)_250px_120px] items-center gap-[18px] py-3 pr-[34px] pl-[52px]";
        row.dataset.service = id;
        row.innerHTML = `
            <div>
                <div class="item-title font-semibold text-base">${item.title}</div>
                <div class="price-text text-[#0080ff] font-bold text-xs">${rupiah(item.price)}/kg</div>
            </div>
            <div class="item-actions flex items-center justify-center gap-4 text-[#0080ff] font-bold text-xs">
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="minus">
                    <img src="../icon/minus.svg" alt="">
                </button>
                <span>${item.quantity} kg</span>
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="plus">
                    <img src="../icon/plus.svg" alt="">
                </button>
                <button class="delete-button w-[34px] h-[34px] border-0 rounded bg-[#df0000] inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="delete">
                    <img src="../icon/trash.svg" alt="">
                </button>
            </div>
            <div class="row-price text-[#0080ff] font-bold text-xs text-right">${rupiah(item.price * item.quantity)}</div>
        `;
        itemParent.appendChild(row);
    });

    updateTotals();
}

function getPickupFee() {
    const selected = document.querySelector('input[name="pickup-method"]:checked');
    return selected ? Number(selected.value) : 0;
}

function updateTotals() {
    let subtotal = 0;
    orderItems.forEach((item) => { subtotal += item.price * item.quantity; });

    const pickupFee = getPickupFee();
    if (subtotalEl)    subtotalEl.textContent    = rupiah(subtotal);
    if (pickupTotalEl) pickupTotalEl.textContent = pickupFee ? rupiah(pickupFee) : "Free";
    if (grandTotalEl)  grandTotalEl.textContent  = rupiah(subtotal + pickupFee);
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
}

document.querySelectorAll('input[name="pickup-method"]').forEach((input) => {
    input.addEventListener("change", updateTotals);
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

        const items = [];
        orderItems.forEach((item, id) => {
            // Gunakan idService dari data-id-service di HTML, atau fallback ke mapping nama
            const serviceIdMap = {
                "express":  2,
                "regular":  1,
                "gaun":     5,
                "jas":      4,
                "setrika":  3,
            };
            items.push({
                idService: item.idService || serviceIdMap[id] || 1,
                quantity:  item.quantity,
            });
        });

        const notifEmail = customEmailRadio?.checked
            ? customEmailInput?.value.trim()
            : getUser()?.email || "";
        localStorage.setItem("last_order_email", notifEmail);

        try {
            const res  = await fetch(`${BASE_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type":  "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    items,
                    metodePengambilan,
                    catatan:            document.getElementById("catatan")?.value || "",
                    notification_email: notifEmail,
                }),
            });

            const data = await res.json();

            if (res.ok) {
                alert("Pemesanan berhasil dibuat!");
                window.location.href = "riwayat-pemesanan.html";
            } else {
                alert(data.message || "Gagal membuat pesanan.");
            }
        } catch (err) {
            alert("Tidak bisa connect ke backend!");
            console.error(err);
        }
    });
}

renderItems();
