const itemParent = document.getElementById("item");
const serviceGrid = document.getElementById("service-grid");
const subtotalEl = document.getElementById("subtotal");
const pickupTotalEl = document.getElementById("pickup-total");
const grandTotalEl = document.getElementById("grand-total");
const customEmailRadio = document.getElementById("custom-email");
const registeredEmailRadio = document.getElementById("registered-email");
const customEmailPanel = document.getElementById("custom-email-panel");
const customEmailInput = document.getElementById("custom-email-input");
const qrisOption = document.getElementById("qris-option");
const qrisPayment = document.getElementById("qris-payment");
const submitOrderButton = document.getElementById("submit-order");

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
        row.className = "item-row";
        row.dataset.service = id;
        row.innerHTML = `
            <div>
                <div class="item-title">${item.title}</div>
                <div class="price-text">${rupiah(item.price)}/kg</div>
            </div>
            <div class="item-actions">
                <button class="icon-button" type="button" data-action="minus" aria-label="Kurangi ${item.title}">
                    <img src="icon/minus.svg" alt="">
                </button>
                <span>${item.quantity} kg</span>
                <button class="icon-button" type="button" data-action="plus" aria-label="Tambah ${item.title}">
                    <img src="icon/plus.svg" alt="">
                </button>
                <button class="delete-button" type="button" data-action="delete" aria-label="Hapus ${item.title}">
                    <img src="icon/trash.svg" alt="">
                </button>
            </div>
            <div class="row-price">${rupiah(item.price * item.quantity)}</div>
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
        } else {
            orderItems.set(id, {
                title: serviceButton.dataset.title,
                price: Number(serviceButton.dataset.price),
                quantity: 1,
            });
            serviceButton.classList.add("is-selected");
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
            if (serviceButton) serviceButton.classList.remove("is-selected");
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

        const email = prompt("Masukkan custom email untuk notifikasi pesanan:");
        if (email && customEmailInput) {
            customEmailInput.value = email.trim();
        }
        if (customEmailPanel) {
            customEmailPanel.classList.add("is-visible");
        }
        alert("Notifikasi akan dikirim ke custom email yang anda isi.");
    });
}

if (registeredEmailRadio) {
    registeredEmailRadio.addEventListener("change", () => {
        if (customEmailPanel) {
            customEmailPanel.classList.remove("is-visible");
        }
    });
}

if (qrisOption && qrisPayment) {
    qrisOption.addEventListener("click", () => {
        qrisPayment.checked = true;
        alert("Pembayaran QRIS dipilih. Silakan scan QR Code untuk melanjutkan pembayaran.");
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
