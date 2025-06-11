const API_BASE_URL = "http://localhost:4000/api";

class AuthService {
  constructor() {
    this.token = localStorage.getItem("whatsapp_token");
    this.user = JSON.parse(localStorage.getItem("whatsapp_user") || "null");
    this.refreshTimer = null;

    // Démarrer la validation automatique si un token existe
    if (this.token) {
      this.startTokenValidation();
    }
  }

  /**
   * Démarre la validation automatique du token
   */
  startTokenValidation() {
    // Valider le token toutes les 5 minutes
    this.refreshTimer = setInterval(() => {
      this.validateAndRefreshToken();
    }, 5 * 60 * 1000);
  }

  /**
   * Arrête la validation automatique du token
   */
  stopTokenValidation() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Valide et rafraîchit le token si nécessaire
   */
  async validateAndRefreshToken() {
    if (!this.token) {
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        this.user = data.user;

        localStorage.setItem("whatsapp_token", this.token);
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));
        return true;
      } else {
        // Token expiré ou invalide
        this.logout();
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      return false;
    }
  }

  /**
   * Connexion d'un utilisateur
   */
  async login(phoneNumber, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, password }),
      });
      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        this.user = data.user;

        localStorage.setItem("whatsapp_token", this.token);
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));

        // Démarrer la validation automatique
        this.startTokenValidation();
        return { success: true, user: this.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register(phoneNumber, password, name) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, password, name }),
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.token;
        this.user = data.user;

        localStorage.setItem("whatsapp_token", this.token);
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));

        // Démarrer la validation automatique
        this.startTokenValidation();
        return { success: true, user: this.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  /**
   * Validation du token stocké
   */
  async validateToken() {
    return await this.validateAndRefreshToken();
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async logout() {
    try {
      if (this.token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }

    // Arrêter la validation automatique
    this.stopTokenValidation();

    // Nettoyage local
    this.token = null;
    this.user = null;

    localStorage.removeItem("whatsapp_token");
    localStorage.removeItem("whatsapp_user");

    // Émettre un événement de déconnexion
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateProfile(updates) {
    if (!this.token) {
      return { success: false, message: "Non authentifié" };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/user/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));
      }
      return data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  /**
   * Récupère la liste des utilisateurs en ligne
   */
  async getOnlineUsers() {
    if (!this.token) {
      return { success: false, message: "Non authentifié" };
    }
    try {
      const response = await fetch(`${API_BASE_URL}/user/online`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des utilisateurs en ligne:",
        error
      );
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  /**
   * Effectue une requête authentifiée
   */
  async authenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error("Non authentifié");
    }
    const headers = {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      ...options.headers,
    };
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si le token est expiré, essayer de le rafraîchir
    if (response.status === 403) {
      const refreshed = await this.validateAndRefreshToken();
      if (refreshed) {
        // Réessayer la requête avec le nouveau token
        headers["Authorization"] = `Bearer ${this.token}`;
        return fetch(url, { ...options, headers });
      } else {
        throw new Error("Session expirée");
      }
    }

    return response;
  }

  // Méthodes existantes (requestVerification, verifyCode, etc.)
  async requestVerification(phoneNumber) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/request-verification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phoneNumber }),
        }
      );

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Erreur lors de la demande de vérification:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  async verifyCode(phoneNumber, code) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber, code }),
      });

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Erreur lors de la vérification du code:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  async resendVerification(phoneNumber) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      return data;
    } catch (error) {
      console.error("Erreur lors du renvoi du code:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  getCurrentUser() {
    return this.user;
  }

  getToken() {
    return this.token;
  }
}

export default new AuthService();
