    // Máscara CPF
    const cpfInput = document.getElementById("cpf");
    cpfInput.addEventListener("input", function () {
      let value = this.value.replace(/\D/g, "");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      this.value = value;
    });

    // Máscara Celular
    const celularInput = document.getElementById("celular");
    celularInput.addEventListener("input", function () {
      let value = this.value.replace(/\D/g, "");
      value = value.replace(/^(\d{2})(\d)/g, "($1) $2");
      value = value.replace(/(\d{5})(\d{4})$/, "$1-$2");
      this.value = value;
    });

    // Popup
    const qrBtn = document.getElementById("qrcodeBtn");
    const qrPopup = document.getElementById("qrPopup");
    const closePopup = document.getElementById("closePopup");

    qrBtn.addEventListener("click", () => {
      qrPopup.classList.remove("hidden");
    });

    closePopup.addEventListener("click", () => {
      qrPopup.classList.add("hidden");
    });

    qrPopup.addEventListener("click", (e) => {
      if (e.target === qrPopup) {
        qrPopup.classList.add("hidden");
      }
    });