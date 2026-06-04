const itemParent = document.getElementById("item");
const serviceGrid = document.getElementById("service-grid");
const subtotalEl = document.getElementById("subtotal");
const pickupTotalEl = document.getElementById("pickup-total");
const grandTotalEl = document.getElementById("grand-total");
const customEmailRadio = document.getElementById("custom-email");
const registeredEmailRadio = document.getElementById("registered-email");
const customEmailPanel = document.getElementById("custom-email-panel");
const customEmailInput = document.getElementById("custom-email-input");
const customEmailModal = document.getElementById("custom-email-modal");
const customEmailModalInput = document.getElementById("custom-email-modal-input");
const cancelCustomEmail = document.getElementById("cancel-custom-email");
const saveCustomEmail = document.getElementById("save-custom-email");
const qrisOption = document.getElementById("qris-option");
const qrisPayment = document.getElementById("qris-payment");
const submitOrderButton = document.getElementById("submit-order");
const qrisModal = document.getElementById("qris-modal");
const closeQrisModal = document.getElementById("close-qris-modal");

const selectedServiceClasses = ["!bg-[#c7e3ff]"];

const orderItems = new Map([
    ["regular", { title: "Cuci Regular", price: 5000, quantity: 2 }],
    ["setrika", { title: "Setrika", price: 3000, quantity: 2 }],
]);

function rupiah(value) {
    return "Rp." + new Intl.NumberFormat("id-ID").format(value);
}

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
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="minus" aria-label="Kurangi ${item.title}">
                    <img src="../icon/minus.svg" alt="">
                </button>
                <span>${item.quantity} kg</span>
                <button class="icon-button w-9 h-7 border border-[#0080ff] rounded bg-white inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="plus" aria-label="Tambah ${item.title}">
                    <img src="../icon/plus.svg" alt="">
                </button>
                <button class="delete-button w-[34px] h-[34px] border-0 rounded bg-[#df0000] inline-flex items-center justify-center cursor-pointer [&_img]:h-4 [&_img]:w-4" type="button" data-action="delete" aria-label="Hapus ${item.title}">
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
    orderItems.forEach((item) => {
        subtotal += item.price * item.quantity;
    });

    const pickupFee = getPickupFee();
    if (subtotalEl) subtotalEl.textContent = rupiah(subtotal);
    if (pickupTotalEl) pickupTotalEl.textContent = pickupFee ? rupiah(pickupFee) : "Free";
    if (grandTotalEl) grandTotalEl.textContent = rupiah(subtotal + pickupFee);
}

if (serviceGrid) {
    serviceGrid.addEventListener("click", (event) => {
        const serviceButton = event.target.closest(".service-card");
        if (!serviceButton) return;

        const id = serviceButton.dataset.service;
        if (orderItems.has(id)) {
            orderItems.delete(id);
            serviceButton.classList.remove("is-selected");
            serviceButton.classList.remove(...selectedServiceClasses);
        } else {
            orderItems.set(id, {
                title: serviceButton.dataset.title,
                price: Number(serviceButton.dataset.price),
                quantity: 1,
            });
            serviceButton.classList.add("is-selected");
            serviceButton.classList.add(...selectedServiceClasses);
        }

        renderItems();
    });
}

if (itemParent) {
    itemParent.addEventListener("click", (event) => {
        const actionButton = event.target.closest("button[data-action]");
        const row = event.target.closest(".item-row");
        if (!actionButton || !row) return;

        const id = row.dataset.service;
        const item = orderItems.get(id);
        if (!item) return;

        const action = actionButton.dataset.action;
        if (action === "plus") {
            item.quantity += 1;
        }

        if (action === "minus" && item.quantity > 1) {
            item.quantity -= 1;
        }

        if (action === "delete") {
            orderItems.delete(id);
            const serviceButton = document.querySelector(`.service-card[data-service="${id}"]`);
            if (serviceButton) {
                serviceButton.classList.remove("is-selected");
                serviceButton.classList.remove(...selectedServiceClasses);
            }
        }

        renderItems();
    });
}

document.querySelectorAll('input[name="pickup-method"]').forEach((input) => {
    input.addEventListener("change", updateTotals);
});

if (customEmailRadio) {
    customEmailRadio.addEventListener("change", () => {
        if (!customEmailRadio.checked) return;

        if (customEmailPanel) {
            customEmailPanel.classList.remove("hidden");
            customEmailPanel.classList.add("flex");
        }
        if (customEmailModalInput && customEmailInput) {
            customEmailModalInput.value = customEmailInput.value;
        }
        if (customEmailModal) {
            customEmailModal.classList.remove("hidden");
            customEmailModal.classList.add("flex");
        }
        customEmailModalInput?.focus();
    });
}

if (registeredEmailRadio) {
    registeredEmailRadio.addEventListener("change", () => {
        if (customEmailPanel) {
            customEmailPanel.classList.add("hidden");
            customEmailPanel.classList.remove("flex");
        }
        if (customEmailModal) {
            customEmailModal.classList.add("hidden");
            customEmailModal.classList.remove("flex");
        }
    });
}

if (cancelCustomEmail && customEmailModal) {
    cancelCustomEmail.addEventListener("click", () => {
        customEmailModal.classList.add("hidden");
        customEmailModal.classList.remove("flex");
        if (customEmailInput && !customEmailInput.value.trim() && registeredEmailRadio) {
            registeredEmailRadio.checked = true;
            if (customEmailPanel) {
                customEmailPanel.classList.add("hidden");
                customEmailPanel.classList.remove("flex");
            }
        }
    });
}

if (saveCustomEmail && customEmailModal) {
    saveCustomEmail.addEventListener("click", () => {
        const email = customEmailModalInput?.value.trim() || "";
        if (!email) {
            alert("Isi custom email terlebih dahulu.");
            customEmailModalInput?.focus();
            return;
        }

        if (customEmailInput) {
            customEmailInput.value = email;
        }
        customEmailModal.classList.add("hidden");
        customEmailModal.classList.remove("flex");
    });
}

if (customEmailModal) {
    customEmailModal.addEventListener("click", (event) => {
        if (event.target === customEmailModal) {
            customEmailModal.classList.add("hidden");
            customEmailModal.classList.remove("flex");
        }
    });
}

if (qrisOption && qrisPayment) {
    qrisOption.addEventListener("click", () => {
        qrisPayment.checked = true;
        if (qrisModal) {
            qrisModal.classList.remove("hidden");
            qrisModal.classList.add("flex");
        }
    });
}

if (closeQrisModal && qrisModal) {
    closeQrisModal.addEventListener("click", () => {
        qrisModal.classList.add("hidden");
        qrisModal.classList.remove("flex");
    });
}

if (qrisModal) {
    qrisModal.addEventListener("click", (event) => {
        if (event.target === qrisModal) {
            qrisModal.classList.add("hidden");
            qrisModal.classList.remove("flex");
        }
    });
}

if (submitOrderButton) {
    submitOrderButton.addEventListener("click", () => {
        if (orderItems.size === 0) {
            alert("Pilih minimal satu layanan sebelum submit pemesanan.");
            return;
        }

        if (customEmailRadio && customEmailRadio.checked && customEmailInput && !customEmailInput.value.trim()) {
            alert("Isi custom email terlebih dahulu sebelum submit pemesanan.");
            customEmailInput.focus();
            return;
        }

        alert("Pemesanan berhasil dibuat. Anda akan diarahkan ke Riwayat Pesanan.");
        window.location.href = "riwayat-pemesanan.html";
    });
}

renderItems();
