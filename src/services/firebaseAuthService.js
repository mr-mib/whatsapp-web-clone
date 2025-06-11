// src/services/firebaseAuthService.js
import {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  updatePhoneNumber,
  PhoneAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { auth } from '../config/firebase.js';

class FirebaseAuthService {
  constructor() {
    this.currentUser = null;
    this.recaptchaVerifier = null;
    this.confirmationResult = null;
    this.authStateListeners = [];

    // Écouter les changements d'état d'authentification
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.notifyAuthStateListeners(user);
    });
  }

  /**
   * Ajoute un listener pour les changements d'état d'authentification
   */
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    callback(this.currentUser);
  }

  /**
   * Supprime un listener d'état d'authentification
   */
  removeAuthStateListener(callback) {
    const index = this.authStateListeners.indexOf(callback);
    if (index > -1) {
      this.authStateListeners.splice(index, 1);
    }
  }

  /**
   * Notifie tous les listeners des changements d'état
   */
  notifyAuthStateListeners(user) {
    this.authStateListeners.forEach(callback => callback(user));
  }

  /**
   * Initialise le reCAPTCHA pour la vérification par téléphone
   */
  initializeRecaptcha(containerId = 'recaptcha-container') {
    if (this.recaptchaVerifier) {
      this.recaptchaVerifier.clear();
    }
    this.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: (response) => {
        console.log('reCAPTCHA résolu');
      },
      'expired-callback': () => {
        console.log('reCAPTCHA expiré');
      }
    });
  }

  /**
   * Envoie un code de vérification par SMS
   */
  async sendPhoneVerification(phoneNumber) {
    try {
      if (!this.recaptchaVerifier) {
        this.initializeRecaptcha();
      }
      this.confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, this.recaptchaVerifier);
      return {
        success: true,
        message: 'Code de vérification envoyé',
        verificationId: this.confirmationResult.verificationId
      };
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS:', error);
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Vérifie le code SMS et connecte l'utilisateur
   */
  async verifyPhoneCode(verificationCode) {
    try {
      if (!this.confirmationResult) {
        throw new Error('Aucune vérification en cours');
      }
      const result = await this.confirmationResult.confirm(verificationCode);
      const user = result.user;
      return {
        success: true,
        user: this.formatUser(user),
        message: 'Connexion réussie'
      };
    } catch (error) {
      console.error('Erreur lors de la vérification du code:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Connexion avec email et mot de passe
   */
  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      return {
        success: true,
        user: this.formatUser(user),
        message: 'Connexion réussie'
      };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Inscription avec email et mot de passe
   */
  async signUpWithEmail(email, password, displayName) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      if (displayName) {
        await updateProfile(user, { displayName });
      }
      return {
        success: true,
        user: this.formatUser(user),
        message: 'Inscription réussie'
      };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Met à jour le profil utilisateur
   */
  async updateUserProfile(updates) {
    try {
      if (!this.currentUser) {
        throw new Error('Aucun utilisateur connecté');
      }
      await updateProfile(this.currentUser, updates);
      return {
        success: true,
        user: this.formatUser(this.currentUser),
        message: 'Profil mis à jour'
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Déconnexion de l'utilisateur
   */
  async signOut() {
    try {
      await signOut(auth);
      if (this.recaptchaVerifier) {
        this.recaptchaVerifier.clear();
        this.recaptchaVerifier = null;
      }
      this.confirmationResult = null;
      return {
        success: true,
        message: 'Déconnexion réussie'
      };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return {
        success: false,
        message: this.getErrorMessage(error.code),
        error: error.code
      };
    }
  }

  /**
   * Formate les données utilisateur Firebase
   */
  formatUser(firebaseUser) {
    if (!firebaseUser) return null;
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      phoneNumber: firebaseUser.phoneNumber,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      emailVerified: firebaseUser.emailVerified,
      isAnonymous: firebaseUser.isAnonymous,
      creationTime: firebaseUser.metadata.creationTime,
      lastSignInTime: firebaseUser.metadata.lastSignInTime
    };
  }

  /**
   * Traduit les codes d'erreur Firebase en messages lisibles
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/user-not-found': 'Aucun utilisateur trouvé avec ces identifiants',
      'auth/wrong-password': 'Mot de passe incorrect',
      'auth/email-already-in-use': 'Cette adresse email est déjà utilisée',
      'auth/weak-password': 'Le mot de passe est trop faible',
      'auth/invalid-email': 'Adresse email invalide',
      'auth/user-disabled': 'Ce compte utilisateur a été désactivé',
      'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard',
      'auth/invalid-phone-number': 'Numéro de téléphone invalide',
      'auth/invalid-verification-code': 'Code de vérification invalide',
      'auth/code-expired': 'Le code de vérification a expiré',
      'auth/missing-verification-code': 'Code de vérification manquant',
      'auth/quota-exceeded': 'Quota SMS dépassé',
      'auth/captcha-check-failed': 'Échec de la vérification reCAPTCHA'
    };
    return errorMessages[errorCode] || 'Une erreur est survenue. Veuillez réessayer.';
  }

  /**
   * Vérifie si un utilisateur est connecté
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Récupère l'utilisateur actuel
   */
  getCurrentUser() {
    return this.formatUser(this.currentUser);
  }

  /**
   * Récupère le token d'authentification
   */
  async getIdToken() {
    if (!this.currentUser) return null;
    try {
      return await this.currentUser.getIdToken();
    } catch (error) {
      console.error('Erreur lors de la récupération du token:', error);
      return null;
    }
  }
}

export default new FirebaseAuthService();
