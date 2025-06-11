// src/components/auth/FirebaseAuthForm.js
import firebaseAuthService from "../../services/firebaseAuthService.js";

export class FirebaseAuthForm {
  constructor(container, onSuccess) {
    this.container = container;
    this.onSuccess = onSuccess;
    this.currentStep = "method-selection"; // method-selection, phone-input, phone-verification, email-auth
    this.phoneNumber = "";
    this.render();
    this.attachEventListeners();
  }

  render() {
    let content = "";
    switch (this.currentStep) {
      case "method-selection":
        content = this.renderMethodSelection();
        break;
      case "phone-input":
        content = this.renderPhoneInput();
        break;
      case "phone-verification":
        content = this.renderPhoneVerification();
        break;
      case "email-auth":
        content = this.renderEmailAuth();
        break;
    }

    this.container.innerHTML = `
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1>WhatsApp Web</h1>
            <p>Authentification Firebase</p>
          </div>
          ${content}
        </div>
        <div id="recaptcha-container"></div>
      </div>
    `;
  }

  renderMethodSelection() {
    return `
      <div class="method-selection">
        <h3>Choisissez votre méthode de connexion</h3>
        <div class="auth-methods">
          <button id="phoneAuthButton" class="auth-method-button">
            📱 Numéro de téléphone
          </button>
          <button id="emailAuthButton" class="auth-method-button">
            📧 Email et mot de passe
          </button>
        </div>
        <div class="auth-footer">
          <p>Retour à l'authentification classique ? <a href="#" id="backToClassic">Cliquez ici</a></p>
        </div>
      </div>
    `;
  }

  renderPhoneInput() {
    return `
      <div class="phone-input">
        <h3>Connexion par téléphone</h3>
        <form id="phoneForm" class="auth-form">
          <div class="form-group">
            <label for="phoneNumber">Numéro de téléphone</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+33 6 12 34 56 78" required>
            <small class="form-hint">Format international requis (+33...)</small>
          </div>
          <button type="submit" class="auth-button" id="sendCodeButton">Envoyer le code</button>
          <div id="errorMessage" class="error-message" style="display: none;"></div>
        </form>
        <div class="auth-footer">
          <button id="backToMethods" class="link-button">← Retour aux méthodes</button>
        </div>
      </div>
    `;
  }

  renderPhoneVerification() {
    return `
      <div class="phone-verification">
        <h3>Vérification du code</h3>
        <p>Code envoyé au <strong>${this.phoneNumber}</strong></p>
        <form id="verificationForm" class="auth-form">
          <div class="form-group">
            <label for="verificationCode">Code de vérification</label>
            <input type="text" id="verificationCode" name="verificationCode" placeholder="123456" maxlength="6" required>
          </div>
          <button type="submit" class="auth-button" id="verifyButton">Vérifier</button>
          <div id="errorMessage" class="error-message" style="display: none;"></div>
        </form>
        <div class="auth-footer">
          <button id="backToPhone" class="link-button">← Modifier le numéro</button>
        </div>
      </div>
    `;
  }

  renderEmailAuth() {
    return `
      <div class="email-auth">
        <div class="auth-tabs">
          <button id="loginTab" class="tab-button active">Connexion</button>
          <button id="registerTab" class="tab-button">Inscription</button>
        </div>
        <form id="emailForm" class="auth-form">
          <div class="form-group">
            <label for="email">Adresse email</label>
            <input type="email" id="email" name="email" placeholder="votre@email.com" required>
          </div>
          <div class="form-group" id="nameGroup" style="display: none;">
            <label for="displayName">Nom d'affichage</label>
            <input type="text" id="displayName" name="displayName" placeholder="Votre nom">
          </div>
          <div class="form-group">
            <label for="password">Mot de passe</label>
            <input type="password" id="password" name="password" placeholder="Votre mot de passe" required>
          </div>
          <button type="submit" class="auth-button" id="emailAuthButton">Se connecter</button>
          <div id="errorMessage" class="error-message" style="display: none;"></div>
        </form>
        <div class="auth-footer">
          <button id="backToMethods" class="link-button">← Retour aux méthodes</button>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    this.container.removeEventListener("click", this.handleClick);
    this.container.removeEventListener("submit", this.handleSubmit);

    this.handleClick = this.handleClick.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.container.addEventListener("click", this.handleClick);
    this.container.addEventListener("submit", this.handleSubmit);
  }

  async handleClick(event) {
    const target = event.target;

    if (target.id === "phoneAuthButton") {
      this.currentStep = "phone-input";
    } else if (target.id === "emailAuthButton") {
      this.currentStep = "email-auth";
    } else if (target.id === "backToMethods") {
      this.currentStep = "method-selection";
    } else if (target.id === "backToPhone") {
      this.currentStep = "phone-input";
    } else if (target.id === "backToClassic") {
      event.preventDefault();
      this.container.dispatchEvent(new CustomEvent("switchToClassic"));
      return;
    } else if (target.id === "loginTab") {
      this.switchEmailTab("login");
      return;
    } else if (target.id === "registerTab") {
      this.switchEmailTab("register");
      return;
    }

    this.render();
    this.attachEventListeners();
  }

  async handleSubmit(event) {
    event.preventDefault();
    const form = event.target;

    if (form.id === "phoneForm") {
      await this.handlePhoneSubmit(form);
    } else if (form.id === "verificationForm") {
      await this.handleVerificationSubmit(form);
    } else if (form.id === "emailForm") {
      await this.handleEmailSubmit(form);
    }
  }

  async handlePhoneSubmit(form) {
    const formData = new FormData(form);
    this.phoneNumber = formData.get("phoneNumber");

    const sendButton = form.querySelector("#sendCodeButton");
    const errorMessage = form.querySelector("#errorMessage");

    sendButton.disabled = true;
    sendButton.textContent = "Envoi en cours...";
    errorMessage.style.display = "none";

    const result = await firebaseAuthService.sendPhoneVerification(
      this.phoneNumber
    );

    if (result.success) {
      this.currentStep = "phone-verification";
      this.render();
      this.attachEventListeners();
    } else {
      errorMessage.textContent = result.message;
      errorMessage.style.display = "block";
      sendButton.disabled = false;
      sendButton.textContent = "Envoyer le code";
    }
  }

  async handleVerificationSubmit(form) {
    const formData = new FormData(form);
    const verificationCode = formData.get("verificationCode");

    const verifyButton = form.querySelector("#verifyButton");
    const errorMessage = form.querySelector("#errorMessage");

    verifyButton.disabled = true;
    verifyButton.textContent = "Vérification...";
    errorMessage.style.display = "none";

    const result = await firebaseAuthService.verifyPhoneCode(verificationCode);

    if (result.success) {
      this.onSuccess(result.user);
    } else {
      errorMessage.textContent = result.message;
      errorMessage.style.display = "block";
      verifyButton.disabled = false;
      verifyButton.textContent = "Vérifier";
    }
  }

  async handleEmailSubmit(form) {
    const formData = new FormData(form);
    const email = formData.get("email");
    const password = formData.get("password");
    const displayName = formData.get("displayName");

    const submitButton = form.querySelector("#emailAuthButton");
    const errorMessage = form.querySelector("#errorMessage");
    const isRegister = submitButton.textContent === "S'inscrire";

    submitButton.disabled = true;
    submitButton.textContent = isRegister ? "Inscription..." : "Connexion...";
    errorMessage.style.display = "none";

    let result;
    if (isRegister) {
      result = await firebaseAuthService.signUpWithEmail(
        email,
        password,
        displayName
      );
    } else {
      result = await firebaseAuthService.signInWithEmail(email, password);
    }

    if (result.success) {
      this.onSuccess(result.user);
    } else {
      errorMessage.textContent = result.message;
      errorMessage.style.display = "block";
      submitButton.disabled = false;
      submitButton.textContent = isRegister ? "S'inscrire" : "Se connecter";
    }
  }

  switchEmailTab(tab) {
    const loginTab = this.container.querySelector("#loginTab");
    const registerTab = this.container.querySelector("#registerTab");
    const nameGroup = this.container.querySelector("#nameGroup");
    const submitButton = this.container.querySelector("#emailAuthButton");

    if (tab === "login") {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      nameGroup.style.display = "none";
      submitButton.textContent = "Se connecter";
    } else {
      registerTab.classList.add("active");
      loginTab.classList.remove("active");
      nameGroup.style.display = "block";
      submitButton.textContent = "S'inscrire";
    }
  }
}
