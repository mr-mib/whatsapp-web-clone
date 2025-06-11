import authService from "../services/authService.js";
import socketService from "../services/socketService.js";

class SessionManager {
  constructor() {
    this.isInitialized = false;
    this.onSessionExpired = null;
    this.onUserLoggedOut = null;
  }

  /**
   * Initialise le gestionnaire de session
   */
  init(callbacks = {}) {
    if (this.isInitialized) {
      return;
    }

    this.onSessionExpired = callbacks.onSessionExpired;
    this.onUserLoggedOut = callbacks.onUserLoggedOut;

    // Écouter les événements de déconnexion
    window.addEventListener(
      "userLoggedOut",
      this.handleUserLoggedOut.bind(this)
    );

    // Écouter les changements de visibilité de la page
    document.addEventListener(
      "visibilitychange",
      this.handleVisibilityChange.bind(this)
    );

    // Écouter les événements de fermeture de fenêtre
    window.addEventListener("beforeunload", this.handleBeforeUnload.bind(this));

    // Écouter les événements de stockage (pour la synchronisation multi-onglets)
    window.addEventListener("storage", this.handleStorageChange.bind(this));
    this.isInitialized = true;
  }

  /**
   * Gère la déconnexion de l'utilisateur
   */
  handleUserLoggedOut() {
    socketService.disconnect();
    if (this.onUserLoggedOut) {
      this.onUserLoggedOut();
    }
  }

  /**
   * Gère les changements de visibilité de la page
   */
  handleVisibilityChange() {
    if (document.hidden) {
      // Page cachée - l'utilisateur a changé d'onglet ou
      minimisé;
      this.updateUserStatus(false);
    } else {
      // Page visible - l'utilisateur est revenu
      this.updateUserStatus(true);
      // Valider le token au retour
      this.validateSession();
    }
  }

  /**
   * Gère la fermeture de la fenêtre
   */
  handleBeforeUnload() {
    this.updateUserStatus(false);
  }

  /**
* Gère les changements dans le localStorage (synchronisation
multi-onglets)
*/
  handleStorageChange(event) {
    if (event.key === "whatsapp_token") {
      if (!event.newValue) {
        // Token supprimé dans un autre onglet - déconnecter
        this.handleUserLoggedOut();
      } else if (event.newValue !== authService.getToken()) {
        // Token mis à jour dans un autre onglet - synchroniser
        authService.token = event.newValue;
        const userData = localStorage.getItem("whatsapp_user");
        if (userData) {
          authService.user = JSON.parse(userData);
        }
      }
    }
  }

  /**
   * Met à jour le statut de l'utilisateur
   */
  async updateUserStatus(isActive) {
    if (authService.isAuthenticated()) {
      try {
        // Mettre à jour via l'API si nécessaire
        // Pour l'instant, on utilise Socket.IO
        if (isActive) {
          socketService.emit("user_active");
        } else {
          socketService.emit("user_inactive");
        }
      } catch (error) {
        console.error("Erreur lors de la mise à jour du statut:", error);
      }
    }
  }

  /**
   * Valide la session actuelle
   */
  async validateSession() {
    if (authService.isAuthenticated()) {
      const isValid = await authService.validateToken();
      if (!isValid && this.onSessionExpired) {
        this.onSessionExpired();
      }
    }
  }

  /**
   * Nettoie les événements
   */
  destroy() {
    if (!this.isInitialized) {
      return;
    }
    window.removeEventListener("userLoggedOut", this.handleUserLoggedOut);
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange
    );
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    window.removeEventListener("storage", this.handleStorageChange);
    this.isInitialized = false;
  }
}
export default new SessionManager();
