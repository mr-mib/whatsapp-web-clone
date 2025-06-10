import authService from "../../services/authService.js";

export class PhoneVerificationForm {
  constructor(container, phoneNumber, onSuccess, onBack) {
    this.container = container;
    this.phoneNumber = phoneNumber;
    this.onSuccess = onSuccess;
    this.onBack = onBack;
    this.resendTimer = null;
    this.resendCountdown = 60;
    this.render();
    this.attachEventListeners();
    this.startResendTimer();
  }

  render() {
    this.container.innerHTML = `
        <div class="auth-container">
            <div class="auth-card">
                <div class="auth-header">
                    <h1>Vérification du numéro</h1>
                    <p>Nous avons envoyé un code de vérification au</p>
                    <p class="phone-display">${this.phoneNumber}</p>
                </div>
                <form id="verificationForm" class="auth-form">
                    <div class="form-group">
                        <label for="verificationCode">Code de vérification</label>
                        <input
                            type="text"id="verificationCode"
                            name="verificationCode"
                            placeholder="123456"
                            maxlength="6"
                            pattern="[0-9]{6}"
                            required
                            autocomplete="one-time-code"
                        >
                        <small class="form-hint">Entrez le code à 6 chiffres reçu par SMS</small>
                    </div>
                    <button type="submit" class="auth-button" id="verifyButton">Vérifier</button>
                    <div id="errorMessage" class="error-message" style="display: none;"></div>
                </form>
                <div class="verification-actions">
                    <button id="resendButton" class="link-button" disabled>
                        Renvoyer le code (<span id="countdown">60</span>s)
                    </button>
                    <button id="backButton" class="link-button">Modifier le numéro</button>
                </div>
                <div id="developmentInfo" class="development-info" style="display: none;">
                    <p><strong>Mode développement:</strong></p>
                    <p>Code: <span id="devCode"></span></p>
                </div>
            </div>
        </div>
`;
  }

  attachEventListeners() {
    const form = this.container.querySelector("#verificationForm");
    const codeInput = this.container.querySelector("#verificationCode");
    const verifyButton = this.container.querySelector("#verifyButton");
    const resendButton = this.container.querySelector("#resendButton");
    const backButton = this.container.querySelector("#backButton");
    const errorMessage = this.container.querySelector("#errorMessage");

    // Auto-focus sur le champ de code
    codeInput.focus();

    // Formatage automatique du code (espaces tous les 3 chiffres)
    codeInput.addEventListener("input", (e) => {
      let value = e.target.value.replace(/\D/g, ""); // Supprimer tout ce qui n'est pas un chiffre
      if (value.length > 6) {
        value = value.substring(0, 6);
      }
      e.target.value = value;

      // Vérification automatique si 6 chiffres sont entrés
      if (value.length === 6) {
        form.dispatchEvent(new Event("submit"));
      }
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const code = codeInput.value.trim();
      if (code.length !== 6) {
        errorMessage.textContent = "Le code doit contenir 6 chiffres";
        errorMessage.style.display = "block";
        return;
      }

      // Désactiver le bouton pendant la requête
      verifyButton.disabled = true;
      verifyButton.textContent = "Vérification...";
      errorMessage.style.display = "none";

      try {
        const result = await authService.verifyCode(this.phoneNumber, code);
        if (result.success) {
          this.onSuccess();
        } else {
          errorMessage.textContent = result.message;
          errorMessage.style.display = "block";
          if (result.attemptsLeft !== undefined) {
            errorMessage.textContent += ` (${result.attemptsLeft} tentative(s) restante(s))`;
          }
        }
      } catch (error) {
        errorMessage.textContent =
          "Une erreur est survenue. Veuillez réessayer.";
        errorMessage.style.display = "block";
      }

      // Réactiver le bouton
      verifyButton.disabled = false;
      verifyButton.textContent = "Vérifier";

      // Vider le champ en cas d'erreur
      if (!result || !result.success) {
        codeInput.value = "";
        codeInput.focus();
      }
    });

    resendButton.addEventListener("click", async () => {
      resendButton.disabled = true;
      resendButton.textContent = "Envoi en cours...";

      try {
        const result = await authService.resendVerification(this.phoneNumber);

        if (result.success) {
          // Afficher le nouveau code en mode développement
          if (result.developmentCode) {
            const devInfo = this.container.querySelector("#developmentInfo");
            const devCode = this.container.querySelector("#devCode");
            devCode.textContent = result.developmentCode;
            devInfo.style.display = "block";
          }

          // Redémarrer le timer
          this.resendCountdown = 60;
          this.startResendTimer();
          errorMessage.style.display = "none";
        } else {
          errorMessage.textContent = result.message;
          errorMessage.style.display = "block";
        }
      } catch (error) {
        errorMessage.textContent = "Erreur lors du renvoi du code";
        errorMessage.style.display = "block";
      }
    });

    backButton.addEventListener("click", () => {
      this.onBack();
    });
  }

  startResendTimer() {
    const resendButton = this.container.querySelector("#resendButton");
    const countdown = this.container.querySelector("#countdown");

    this.resendTimer = setInterval(() => {
      this.resendCountdown--;
      countdown.textContent = this.resendCountdown;
      
      if (this.resendCountdown <= 0) {
        clearInterval(this.resendTimer);
        resendButton.disabled = false;
        resendButton.innerHTML = "Renvoyer le code";
      }
    }, 1000);
  }
  destroy() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }
  // Méthode pour afficher le code en mode développement
  showDevelopmentCode(code) {
    const devInfo = this.container.querySelector("#developmentInfo");
    const devCode = this.container.querySelector("#devCode");
    devCode.textContent = code;
    devInfo.style.display = "block";
  }
}
