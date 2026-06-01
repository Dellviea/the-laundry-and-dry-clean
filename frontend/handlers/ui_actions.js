document.addEventListener("click", (event) => {
    const popupButton = event.target.closest("[data-popup]");
    if (popupButton) {
        alert(popupButton.dataset.popup);
        return;
    }

    const pageButton = event.target.closest(".page-number");
    if (pageButton) {
        const pagination = pageButton.closest(".pagination");
        if (pagination) {
            pagination.querySelectorAll(".page-number").forEach((button) => {
                button.classList.remove("is-active");
            });
            pageButton.classList.add("is-active");
            alert(`Menampilkan halaman ${pageButton.textContent.trim()}`);
        }
        return;
    }

    const uploadBox = event.target.closest(".upload-box");
    if (uploadBox) {
        alert("Fitur upload bukti akan dihubungkan ke backend nanti.");
    }
});

document.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-demo-form]");
    if (!form) return;

    event.preventDefault();
    alert(form.dataset.success || "Data berhasil diproses.");
});
