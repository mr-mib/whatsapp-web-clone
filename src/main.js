import "./style.css";
import "./styles/auth.css";
import authService from "./services/authService.js";
import socketService from "./services/socketService.js";
import sessionManager from "./utils/sessionManager.js";
import { LoginForm } from "./components/auth/LoginForm.js";
import { RegisterForm } from "./components/auth/RegisterForm.js";

class App {
  constructor() {
    this.container = document.querySelector("#app");
    this.currentUser = null;
    this.init();
  }

  async init() {
    // Initialiser le gestionnaire de session
    sessionManager.init({
      onSessionExpired: () => this.handleSessionExpired(),
      onUserLoggedOut: () => this.showAuthScreen(),
    });

    // Vérifier si l'utilisateur est déjà connecté
    const isAuthenticated = await authService.validateToken();
    if (isAuthenticated) {
      this.currentUser = authService.getCurrentUser();
      socketService.connect();
      this.showMainApp();
    } else {
      this.showAuthScreen();
    }
  }

  handleSessionExpired() {
    // Afficher un message d'expiration de session
    this.showSessionExpiredMessage();

    // Rediriger vers l'écran d'authentification après 3
    secondes;
    setTimeout(() => {
      this.showAuthScreen();
    }, 3000);
  }

  showSessionExpiredMessage() {
    this.container.innerHTML = `
      <div class="session-expired">
        <div class="session-expired-card">
          <h2>Session expirée</h2>
          <p>Votre session a expiré. Vous allez être redirigé
          vers la page de connexion.</p>
          <div class="loading-spinner"></div>
        </div>
      </div>
`;

    // Ajouter les styles pour le message d'expiration
    const style = document.createElement("style");
    style.textContent = `
      .session-expired {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #667eea 0%, #764ba2
        100%);
      }
      .session-expired-card {
        background: white;
        border-radius: 12px;
        padding: 40px;
        text-align: center;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        max-width: 400px;
      }
      .session-expired-card h2 {
        color: #e74c3c;
        margin-bottom: 20px;
      }
      .loading-spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #25D366;
        border-radius: 50%;
        width: 30px;
        height: 30px;animation: spin 1s linear infinite;
        margin: 20px auto;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
`;

    document.head.appendChild(style);
  }

  showAuthScreen() {
    this.showLogin();
  }

  showLogin() {
    const loginForm = new LoginForm(this.container, (user) => {
      this.currentUser = user;
      this.showMainApp();
    });
    this.container.addEventListener("switchToRegister", () => {
      this.showRegister();
    });
  }

  showRegister() {
    const registerForm = new RegisterForm(this.container, (user) => {
      this.currentUser = user;
      this.showMainApp();
    });
    this.container.addEventListener("switchToLogin", () => {
      this.showLogin();
    });
  }

  showMainApp() {
    this.container.innerHTML = `
      <div class="main-app">
        <div class="header">
          <div class="user-info">
            <img src="${this.currentUser.profilePicture}" alt="Profile" class="profile-pic">
            <div class="user-details">
              <h1>Bienvenue, ${this.currentUser.name}!</h1>
                <p class="user-status">${this.currentUser.status}</p>
            </div>
          </div>
          <div class="header-actions">
            <button id="profileButton" class="action-button">Profil</button>
            <button id="logoutButton" class="logout-button">Se déconnecter</button>
          </div>
        </div>
        <div class="content">
          <div class="welcome-message">
            <h2>Interface principale de WhatsApp Web</h2>
            <p>Utilisateur connecté: ${this.currentUser.phoneNumber}</p>
            <p>Statut: <span class="online-status">En ligne</span></p>
            <div class="session-info">
              <p><small>Session sécurisée avec validation automatique</small></p>
            </div>
          </div>
        </div>
      </div>
`;

    // Ajouter les styles pour l'interface principale
    const style = document.createElement("style");

    style.textContent = `
      .main-app {
        min-height: 100vh;
        background: #f0f0f0;
      }
      .header {
        background: #25D366;
        color: white;
        padding: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      .user-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .profile-pic {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 2px solid rgba(255,255,255,0.3);
      }
      .user-details h1 {
        margin: 0;
        font-size: 1.2rem;}
        .user-status {
        margin: 0;
        opacity: 0.8;
        font-size: 0.9rem;
      }
      .header-actions {
        display: flex;
        gap: 10px;
      }
      .action-button {
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      .action-button:hover {
        background: rgba(255,255,255,0.3);
      }
      .logout-button {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      .logout-button:hover {
        background: #c0392b;
      }
      .content {
        padding: 40px;
      }
      .welcome-message {
        text-align: center;
        background: white;
        padding: 40px;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 600px;
        margin: 0 auto;
      }
      .online-status {
        color: #25D366;
        font-weight: bold;
      }
      .session-info {
        margin-top: 20px;padding-top: 20px;
        border-top: 1px solid #eee;
      }
      .session-info small {
        color: #666;
      }
`;

    document.head.appendChild(style);

    // Gérer les actions
    const logoutButton = this.container.querySelector("#logoutButton");
    const profileButton = this.container.querySelector("#profileButton");
    logoutButton.addEventListener("click", async () => {
      await authService.logout();
      socketService.disconnect();
      this.currentUser = null;
      this.showAuthScreen();
    });
    profileButton.addEventListener("click", () => {
      this.showProfileModal();
    });
  }

  showProfileModal() {
    // Créer une modal simple pour l'édition du profil
    const modal = document.createElement("div");

    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h3>Modifier le profil</h3>
          <button class="close-button">&times;</button>
        </div>
        <div class="modal-body">
          <form id="profileForm">
            <div class="form-group">
              <label for="profileName">Nom</label>
              <input type="text" id="profileName" value="${this.currentUser.name}" required>
            </div>
            <div class="form-group">
              <label for="profileStatus">Statut</label>
              <input type="text" id="profileStatus" value="${this.currentUser.status}" required>
            </div>
            <div class="form-actions">
              <button type="button" class="cancel-button">Annuler</button>
              <button type="submit" class="save-button">Sauvegarder</button>
            </div>
          </form>
        </div>
      </div>
`;

    // Ajouter les styles de la modal
    const modalStyle = document.createElement("style");
    modalStyle.textContent = `
      .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        background: white;
        border-radius: 12px;
        width: 90%;
        max-width: 400px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.2);
      }
      .modal-header {
        padding: 20px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .modal-header h3 {
        margin: 0;
      }
      .close-button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        color: #666;
      }
      .modal-body {
        padding: 20px;
      }
      .form-actions {
        display: flex;gap: 10px;
        justify-content: flex-end;
        margin-top: 20px;
      }
      .cancel-button {
        background: #ccc;
        color: #333;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
      }
      .save-button {
        background: #25D366;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 6px;
        cursor: pointer;
      }
`;

    document.head.appendChild(modalStyle);
    document.body.appendChild(modal);

    // Gérer les événements de la modal
    const closeButton = modal.querySelector(".close-button");
    const cancelButton = modal.querySelector(".cancel-button");
    const profileForm = modal.querySelector("#profileForm");

    const closeModal = () => {
      document.body.removeChild(modal);
      document.head.removeChild(modalStyle);
    };

    closeButton.addEventListener("click", closeModal);
    cancelButton.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });

    profileForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = modal.querySelector("#profileName").value;
      const status = modal.querySelector("#profileStatus").value;
      const result = await authService.updateProfile({ name, status });

      if (result.success) {
        this.currentUser = result.user;
        closeModal();
        this.showMainApp(); // Rafraîchir l'interface
      } else {
        alert("Erreur lors de la mise à jour du profil: " + result.message);
      }
    });
  }
}

// Initialiser l'application
new App();
