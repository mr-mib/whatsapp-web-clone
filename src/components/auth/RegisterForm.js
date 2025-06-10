import authService from "../../services/authService.js";
import socketService from "../../services/socketService.js";

export class RegisterForm {
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
                <p>Créez votre compte</p>
            </div>

            <form id="registerForm" class="auth-form">
                <div class="form-group">
                    <label for="name">Nom complet</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Votre nom complet"
                        required
                    >
                </div>

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
                        name="password"placeholder="Choisissez un mot de passe"
                        required
                    >
                </div>
                
                <div class="form-group">
                    <label for="confirmPassword">Confirmer le mot de passe</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        placeholder="Confirmez votre mot de passe"
                        required
                    >
                </div>

                <button type="submit" class="auth-button" id="registerButton"> S'inscrire </button>
                <div id="errorMessage" class="error-message" style="display: none;"></div>
            </form>

            <div class="auth-footer">
                <p>Déjà un compte ?
                    <a href="#" id="switchToLogin">Se connecter</a>
                </p>
            </div>
        </div>
    </div>
`;
  }

  attachEventListeners() {
    const form = this.container.querySelector("#registerForm");
    const switchToLogin = this.container.querySelector("#switchToLogin");
    const errorMessage = this.container.querySelector("#errorMessage");
    const registerButton = this.container.querySelector("#registerButton");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const name = formData.get("name");
      const phoneNumber = formData.get("phoneNumber");
      const password = formData.get("password");
      const confirmPassword = formData.get("confirmPassword");

      // Validation côté client
      if (password !== confirmPassword) {
        errorMessage.textContent = "Les mots de passe ne correspondent pas";
        errorMessage.style.display = "block";
        return;
      }
      if (password.length < 6) {
        errorMessage.textContent = "Le mot de passe doit contenir au moins 6 caractères";
        errorMessage.style.display = "block";
        return;
      }

      // Désactiver le bouton pendant la requête
      registerButton.disabled = true;
      registerButton.textContent = "Inscription...";
      errorMessage.style.display = "none";
      try {
        const result = await authService.register(phoneNumber, password, name);

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
        errorMessage.textContent = "Une erreur est survenue. Veuillez réessayer.";
        errorMessage.style.display = "block";
      }

      // Réactiver le bouton
      registerButton.disabled = false;
      registerButton.textContent = "S'inscrire";
    });

    switchToLogin.addEventListener("click", (e) => {
      e.preventDefault();

      // Émettre un événement personnalisé pour changer de vue
      this.container.dispatchEvent(new CustomEvent("switchToLogin"));
    });
  }
}
