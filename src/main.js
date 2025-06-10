// // src/main.js
// import "./style.css";
// import javascriptLogo from "./javascript.svg";
// import viteLogo from "/vite.svg";
// import { setupCounter } from "./counter.js";
// import { io } from "socket.io-client";

// // Importez le client Socket.IO
// // Initialisez la connexion Socket.IO
// const socket = io("http://localhost:4000");

// // Écoutez les événements du serveur
// socket.on("connect", () => {
//   console.log("Connected to Socket.IO server");
// });

// socket.on("disconnect", () => {
//   console.log("Disconnected from Socket.IO server");
// });

// socket.on("chat message", (msg) => {
//   console.log("Received message: " + msg);
//   // Ici, vous afficherez le message dans l'interface utilisateur
// });

// document.querySelector("#app").innerHTML = `
//   <div>
//     <a href="https://vitejs.dev" target="_blank">
//       <img src="${viteLogo}" class="logo" alt="Vite logo" />
//     </a>
//     <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
//       <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
//     </a>
//     <h1>Hello Vite!</h1>
//     <div class="card">
//       <button id="counter" type="button"></button>
//     </div>
//     <p class="read-the-docs">
//       Click on the Vite logo to learn more
//     </p>
//   </div>
// `;

// setupCounter(document.querySelector("#counter"));

// // Exemple: Envoyer un message après 5 secondes
// setTimeout(() => {
//   socket.emit("chat message", "Hello from client!");
// }, 5000);

// =============== NOUVEAU ===============
// src/main.js
import "./style.css";
import "./styles/auth.css";
import authService from "./services/authService.js";
import socketService from "./services/socketService.js";
import { LoginForm } from "./components/auth/LoginForm.js";
import { RegisterForm } from "./components/auth/RegisterForm.js";

class App {
  constructor() {
    this.container = document.querySelector("#app");
    this.currentUser = null;
    this.init();
  }

  async init() {
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

  showAuthScreen() {
    // Afficher l'écran de connexion par défaut
    this.showLogin();
  }

  showLogin() {
    const loginForm = new LoginForm(this.container, (user) => {
      this.currentUser = user;
      this.showMainApp();
    });

    // Écouter l'événement de changement vers l'inscription
    this.container.addEventListener("switchToRegister", () => {
      this.showRegister();
    });
  }

  showRegister() {
    const registerForm = new RegisterForm(this.container, (user) => {
      this.currentUser = user;
      this.showMainApp();
    });

    // Écouter l'événement de changement vers la connexion
    this.container.addEventListener("switchToLogin", () => {
      this.showLogin();
    });
  }

  showMainApp() {
    // Pour l'instant, afficher simplement un message de bienvenue;
    // Nous implémenterons l'interface principale dans la prochaine section
    this.container.innerHTML = `
      <div class="main-app">
        <div class="header">
          <h1>Bienvenue, ${this.currentUser.name}!</h1>
          <button id="logoutButton" class="logout-button">Se
          déconnecter</button>
        </div>
        <div class="content">
          <p>Interface principale de WhatsApp Web à venir...</p>
          <p>Utilisateur connecté: ${this.currentUser.phoneNumber}</p>
        </div>
      </div>
`;
    // Ajouter les styles pour l'interface principale temporaire
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
      }
      .header h1 {
      margin: 0;
      }
      .logout-button {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      }
      .logout-button:hover {
      background: rgba(255,255,255,0.3);
      }
      .content {
      padding: 40px;
      text-align: center;
      }
`;
    document.head.appendChild(style);

    // Gérer la déconnexion
    const logoutButton = this.container.querySelector("#logoutButton");
    logoutButton.addEventListener("click", async () => {
      await authService.logout();
      socketService.disconnect();
      this.currentUser = null;
      this.showAuthScreen();
    });
  }
}
// Initialiser l'application
new App();
