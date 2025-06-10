const API_BASE_URL = "http://localhost:4000/api";

class AuthService {
  constructor() {
    this.token = localStorage.getItem("whatsapp_token");
    this.user = JSON.parse(localStorage.getItem("whatsapp_user") || "null");
  }

  /**
   * Connexion d'un utilisateur
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} password - Mot de passe
   * @returns {Promise<Object>} - Résultat de la connexion
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

        // Stockage dans localStorage
        localStorage.setItem("whatsapp_token", this.token);
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));

        return { success: true, user: this.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error("Erreur lors de la connexion:", error);
      return { success: false, message: "Erreur de connexion au serveur" };
    }
  }

  /*** Inscription d'un nouvel utilisateur
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} password - Mot de passe
   * @param {string} name - Nom de l'utilisateur
   * @returns {Promise<Object>} - Résultat de l'inscription
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

        // Stockage dans localStorage
        localStorage.setItem("whatsapp_token", this.token);
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));

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
   * @returns {Promise<boolean>} - True si le token est valide
   */
  async validateToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: this.token }),
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        localStorage.setItem("whatsapp_user", JSON.stringify(this.user));
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error("Erreur lors de la validation du token:", error);
      this.logout();
      return false;
    }
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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token: this.token }),
        });
      }
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
    }

    // Nettoyage local
    this.token = null;
    this.user = null;
    localStorage.removeItem("whatsapp_token");
    localStorage.removeItem("whatsapp_user");
  }

  /**
   * Vérifie si l'utilisateur est connecté*
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  /**
   * Récupère l'utilisateur actuel
   * @returns {Object|null}
   */
  getCurrentUser() {
    return this.user;
  }

  /**
   * Récupère le token actuel
   * @returns {string|null}
   */
  getToken() {
    return this.token;
  }
}

// Export d'une instance singleton
export default new AuthService();
