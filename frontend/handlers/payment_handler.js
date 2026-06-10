const API_BASE_URL = "http://127.0.0.1:5000";
const REDIRECT_DELAY_MS = 2200;

const titleEl = document.getElementById("payment-title");
const messageEl = document.getElementById("payment-message");
const iconEl = document.getElementById("payment-icon");
const paymentAction = document.getElementById("payment-action");
const historyAction = document.getElementById("history-action");

const params = new URLSearchParams(window.location.search);
const orderId = params.get("order_id");
const status = params.get("status");

function setState({ icon, title, message, actionUrl, showHistory = false }) {
    if (iconEl) iconEl.textContent = icon;
    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    if (paymentAction) {
        if (actionUrl) {
            paymentAction.href = actionUrl;
            paymentAction.classList.remove("hidden");
            paymentAction.classList.add("inline-flex");
        } else {
            paymentAction.classList.add("hidden");
            paymentAction.classList.remove("inline-flex");
        }
    }

    if (historyAction) {
        if (showHistory) {
            historyAction.classList.remove("hidden");
        } else {
            historyAction.classList.add("hidden");
        }
    }
}

function redirectToHistory() {
    window.location.href = "riwayat-pemesanan.html";
}

async function fetchPaymentStatus(orderId) {
    const token = localStorage.getItem("token");
    if (!token) {
        throw new Error("Token login tidak ditemukan.");
    }

    const response = await fetch(`${API_BASE_URL}/payments/xendit/status/${orderId}`, {
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });
    const result = await response.json();
    if (!response.ok || !result.success) {
        throw new Error(result.message || "Status pembayaran belum bisa dibaca.");
    }
    return result.data;
}

async function waitForSuccess(orderId) {
    setState({
        icon: "!",
        title: "Memverifikasi pembayaran",
        message: "Pembayaran sudah selesai di Xendit. Kami sedang menunggu konfirmasi transaksi.",
    });

    for (let attempt = 0; attempt < 10; attempt += 1) {
        try {
            const payment = await fetchPaymentStatus(orderId);
            if (payment.status === "PAID") {
                setState({
                    icon: "OK",
                    title: "Transaksi berhasil",
                    message: "Pembayaran QRIS berhasil dikonfirmasi. Anda akan diarahkan ke Riwayat Pesanan.",
                    showHistory: true,
                });
                setTimeout(redirectToHistory, REDIRECT_DELAY_MS);
                return;
            }
        } catch (error) {
            if (attempt === 9) {
                setState({
                    icon: "!",
                    title: "Menunggu konfirmasi",
                    message: error.message,
                    showHistory: true,
                });
                return;
            }
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    setState({
        icon: "!",
        title: "Menunggu konfirmasi",
        message: "Xendit belum mengirim konfirmasi pembayaran. Coba buka Riwayat Pesanan beberapa saat lagi.",
        showHistory: true,
    });
}

function startPaymentRedirect() {
    const pendingPayment = JSON.parse(sessionStorage.getItem("pendingXenditPayment") || "{}");
    const invoiceUrl = pendingPayment.invoiceUrl;

    if (!invoiceUrl) {
        setState({
            icon: "!",
            title: "Payment link tidak ditemukan",
            message: "Silakan kembali ke halaman pemesanan dan submit ulang pesanan.",
            showHistory: true,
        });
        return;
    }

    setState({
        icon: "QR",
        title: "Mengarahkan ke Xendit",
        message: "Anda akan diarahkan ke halaman pembayaran Xendit untuk menyelesaikan QRIS.",
        actionUrl: invoiceUrl,
    });

    setTimeout(() => {
        window.location.href = invoiceUrl;
    }, 1500);
}

if (historyAction) {
    historyAction.addEventListener("click", redirectToHistory);
}

if (status === "success" && orderId) {
    waitForSuccess(orderId);
} else if (status === "failed") {
    setState({
        icon: "!",
        title: "Pembayaran belum berhasil",
        message: "Pembayaran dibatalkan atau gagal. Anda dapat kembali ke pemesanan untuk mencoba lagi.",
        showHistory: true,
    });
} else {
    startPaymentRedirect();
}
