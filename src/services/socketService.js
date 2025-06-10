import { io } from "socket.io-client";
import authService from "./authService.js";

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  /**
   * Initialise la connexion Socket.IO
   */
  connect() {
    if (this.socket) {
      return;
    }

    this.socket = io("http://localhost:4000");

    this.socket.on("connect", () => {
      console.log("Connecté au serveur Socket.IO");

      this.isConnected = true;

      // Authentification automatique si un token est disponible
      const token = authService.getToken();
      if (token) {
        this.authenticate(token);
      }
    });

    this.socket.on("disconnect", () => {
      console.log("Déconnecté du serveur Socket.IO");
      this.isConnected = false;
    });

    this.socket.on("authentication_error", (message) => {
      console.error("Erreur d'authentification Socket.IO:", message);
      authService.logout();
    });
  }

  /**
   * Authentifie l'utilisateur via Socket.IO
   * @param {string} token - Token d'authentification
   */
  authenticate(token) {
    if (this.socket && this.isConnected) {
      this.socket.emit("authenticate", token);
    }
  }

  /**
   * Déconnecte Socket.IO
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Émet un événement
   * @param {string} event - Nom de l'événement
   * @param {*} data - Données à envoyer
   */
  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    }
  }

  /**
   * Écoute un événement
   * @param {string} event - Nom de l'événement
   * @param {Function} callback - Fonction de callback
   */
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  /**
* Arrête d'écouter un événement
* @param {string} event - Nom de l'événement
* @param {Function} callback - Fonction de callback
(optionnel)
*/
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

// Export d'une instance singleton
export default new SocketService();
