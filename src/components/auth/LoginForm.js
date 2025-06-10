import authService from "../../services/authService.js";
import socketService from "../../services/socketService.js";

export class LoginForm {
  constructor(container, onSuccess) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.render();
    this.attachEventListeners();
  }

  render() {
    this.container.innerHTML = `
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1>WhatsApp Web</h1>
                <p>Connectez-vous à votre compte</p>
            </div>

            <form id="loginForm" class="auth-form">
                <div class="form-group">
                    <label for="phoneNumber">Numéro de téléphone</label>
                    <input
                        type="tel"
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+33 6 12 34 56 78"
                        required
                    >
                </div>
                <div class="form-group">
                    <label for="password">Mot de passe</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        placeholder="Votre mot de passe"
                        required
                    >
                </div>
                <button type="submit" class="auth-button" id="loginButton"> Se connecter </button>

                <div id="errorMessage" class="error-message" style="display: none;"></div>
            </form>

            <div class="auth-footer">
                <p>Pas encore de compte ?
                    <a href="#" id="switchToRegister">S'inscrire</a>
                </p>
            </div>
        </div>
    </div>
`;
  }

  attachEventListeners() {
    const form = this.container.querySelector("#loginForm");
    const switchToRegister = this.container.querySelector("#switchToRegister");
    const errorMessage = this.container.querySelector("#errorMessage");
    const loginButton = this.container.querySelector("#loginButton");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const phoneNumber = formData.get("phoneNumber");
      const password = formData.get("password");

      // Désactiver le bouton pendant la requête
      loginButton.disabled = true;
      loginButton.textContent = "Connexion...";
      errorMessage.style.display = "none";
      try {
        const result = await authService.login(phoneNumber, password);
        if (result.success) {
          // Connexion Socket.IO
          socketService.connect();
          // Appeler le callback de succès
          this.onSuccess(result.user);
        } else {
          errorMessage.textContent = result.message;
          errorMessage.style.display = "block";
        }
      } catch (error) {
        errorMessage.textContent =
          "Une erreur est survenue. Veuillez réessayer.";
        errorMessage.style.display = "block";
      }
      // Réactiver le bouton
      loginButton.disabled = false;
      loginButton.textContent = "Se connecter";
    });
    switchToRegister.addEventListener("click", (e) => {
      e.preventDefault();
      // Émettre un événement personnalisé pour changer de vue
      this.container.dispatchEvent(new CustomEvent("switchToRegister"));
    });
  }
}
