const jwt = require("jsonwebtoken");

// Clé secrète pour signer les JWT (en production, utilisez une variable d'environnement)
const JWT_SECRET = "your-super-secret-jwt-key-change-this-in-production";
const JWT_EXPIRES_IN = "15d"; // Token valide pendant 15 jours

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Configuration CORS pour Express
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// Middleware pour parser le JSON
app.use(express.json());

// Configuration Socket.IO avec CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Simulation d'une base de données en mémoire (en production, utilisez une vraie DB)
let users = [
  {
    id: "user1",
    phoneNumber: "+221771234567",
    password: "password123",
    name: "Moustapha Sayande",
    profilePicture: "https://via.placeholder.com/150/FF0000/FFFFFF?text=A",
    status: "Hey there! I am using WhatsApp.",
    lastSeen: Date.now(),
    isOnline: false,
    contacts: [
      {
        id: "user2",
        name: "Paul ODC",
        phoneNumber: "+221767654321",
      },
    ],
  },
  {
    id: "user2",
    phoneNumber: "+221767654321",
    password: "password456",
    name: "Paul ODC",
    profilePicture: "https://via.placeholder.com/150/0000FF/FFFFFF?text=B",
    status: "Available",
    lastSeen: Date.now(),
    isOnline: false,
    contacts: [
      {
        id: "user1",
        name: "Moustapha Sayande",
        phoneNumber: "+221771234567",
      },
    ],
  },
];

/*** Génère un token JWT pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} - Token JWT
 */
function generateToken(userId) {
  return jwt.sign(
    {
      userId,
      type: "access_token",
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Valide un token JWT
 * @param {string} token - Token à valider
 * @returns {string|null} - ID utilisateur si valide, null sinon
 */
function validateToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId;
  } catch (error) {
    console.log("Token invalide:", error.message);
    return null;
  }
}

/**
 * Middleware pour vérifier l'authentification
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token d'accès requis",
    });
  }

  const userId = validateToken(token);
  if (!userId) {
    return res.status(403).json({
      success: false,
      message: "Token invalide ou expiré",
    });
  }

  req.userId = userId;
  next();
}

// Route d'authentification
app.post("/api/auth/login", (req, res) => {
  const { phoneNumber, password } = req.body;

  console.log("Tentative de connexion:", { phoneNumber, password });

  // Recherche de l'utilisateur
  const user = users.find(
    (u) => u.phoneNumber === phoneNumber && u.password === password
  );

  if (user) {
    // Génération du token
    const token = generateToken(user.id);

    // Mise à jour du statut en ligne
    user.isOnline = true;
    user.lastSeen = Date.now();

    // Réponse avec les informations utilisateur (sans le mot de passe)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      success: true,
      token,
      user: userWithoutPassword,
    });

    console.log("Connexion réussie pour:", user.name);
  } else {
    res.status(401).json({
      success: false,
      message: "Numéro de téléphone ou mot de passe incorrect",
    });

    console.log("Échec de connexion pour:", phoneNumber);
  }
});

// Route d'inscription
app.post("/api/auth/register", (req, res) => {
  const { phoneNumber, password, name } = req.body;

  console.log("Tentative d'inscription:", { phoneNumber, name });

  // Vérification si l'utilisateur existe déjà
  const existingUser = users.find((u) => u.phoneNumber === phoneNumber);

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Un utilisateur avec ce numéro de téléphone existe déjà",
    });
  }

  // Création du nouvel utilisateur
  const newUser = {
    id: `user${Date.now()}`,
    phoneNumber,
    password,
    name,
    profilePicture: `https://via.placeholder.com/150/00FF00/FFFFFF?text=${name
      .charAt(0)
      .toUpperCase()}`,
    status: "Hey there! I am using WhatsApp.",
    lastSeen: Date.now(),
    isOnline: true,
    contacts: [],
  };

  users.push(newUser);

  // Génération du token
  const token = generateToken(newUser.id);

  // Réponse avec les informations utilisateur (sans le mot de passe)
  const { password: _, ...userWithoutPassword } = newUser;
  res.json({
    success: true,
    token,
    user: userWithoutPassword,
  });
  console.log("Inscription réussie pour:", newUser.name);
});

// Route de validation de token
app.post("/api/auth/validate", (req, res) => {
  const { token } = req.body;

  const userId = validateToken(token);

  if (userId) {
    const user = users.find((u) => u.id === userId);
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        success: true,
        user: userWithoutPassword,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }
  } else {
    res.status(401).json({
      success: false,
      message: "Token invalide",
    });
  }
});

// Route de déconnexion
app.post("/api/auth/logout", (req, res) => {
  const { token } = req.body;

  const userId = validateToken(token);

  if (userId) {
    const user = users.find((u) => u.id === userId);
    if (user) {
      user.isOnline = false;
      user.lastSeen = Date.now();
    }
  }

  res.json({
    success: true,
    message: "Déconnexion réussie",
  });
});

// Gestion des connexions Socket.IO
io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté:", socket.id);

  // Authentification via Socket.IO
  socket.on("authenticate", (token) => {
    const userId = validateToken(token);
    if (userId) {
      socket.userId = userId;
      socket.join(`user_${userId}`);
      console.log(`Utilisateur ${userId} authentifié via
Socket.IO`);

      // Mise à jour du statut en ligne
      const user = users.find((u) => u.id === userId);
      if (user) {
        user.isOnline = true;
        user.lastSeen = Date.now();
      }
    } else {
      socket.emit("authentication_error", "Token invalide");
    }
  });

  socket.on("disconnect", () => {
    console.log("Utilisateur déconnecté:", socket.id);

    // Mise à jour du statut hors ligne
    if (socket.userId) {
      const user = users.find((u) => u.id === socket.userId);
      if (user) {
        user.isOnline = false;
        user.lastSeen = Date.now();
      }
    }
  });

  // Exemple: écouter un événement 'chat message' et le retransmettre;
  socket.on("chat message", (msg) => {
    console.log("message: " + msg);
    io.emit("chat message", msg);
  });
});

server.listen(4000, () => {
  console.log("Serveur en écoute sur le port 4000");
});

// Ajoutez ces routes après les routes d'authentification existantes

// Stockage temporaire des codes de vérification (en production, utilisez Redis ou une DB)
let verificationCodes = new Map();

// Route pour demander un code de vérification
app.post("/api/auth/request-verification", (req, res) => {
  const { phoneNumber } = req.body;
  console.log("Demande de code de vérification pour:", phoneNumber);

  // Vérifier si l'utilisateur existe déjà
  const existingUser = users.find((u) => u.phoneNumber === phoneNumber);
  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Un utilisateur avec ce numéro de téléphone existe déjà",
    });
  }

  // Générer un code de vérification à 6 chiffres
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Stocker le code avec une expiration de 5 minutes
  verificationCodes.set(phoneNumber, {
    code: verificationCode,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });

  // En production, vous enverriez un SMS ici
  console.log(`Code de vérification pour ${phoneNumber}: ${verificationCode}`);
  res.json({
    success: true,
    message: "Code de vérification envoyé",
    // En développement, on peut retourner le code pour faciliter les tests
    // En production, ne jamais retourner le code ! developmentCode: verificationCode
  });
});

// Route pour vérifier le code
app.post("/api/auth/verify-code", (req, res) => {
  const { phoneNumber, code } = req.body;

  console.log("Vérification du code pour:", phoneNumber, "Code:", code);

  const storedData = verificationCodes.get(phoneNumber);

  if (!storedData) {
    return res.status(400).json({
      success: false,
      message: "Aucun code de vérification trouvé pour ce numéro",
    });
  }

  // Vérifier l'expiration
  if (Date.now() > storedData.expires) {
    verificationCodes.delete(phoneNumber);
    return res.status(400).json({
      success: false,
      message: "Le code de vérification a expiré",
    });
  }

  // Vérifier le nombre de tentatives
  if (storedData.attempts >= 3) {
    verificationCodes.delete(phoneNumber);
    return res.status(400).json({
      success: false,
      message: "Trop de tentatives. Demandez un nouveau code.",
    });
  }

  // Vérifier le code
  if (storedData.code !== code) {
    storedData.attempts++;
    return res.status(400).json({
      success: false,
      message: "Code de vérification incorrect",
      attemptsLeft: 3 - storedData.attempts,
    });
  }

  // Code correct, supprimer de la mémoire
  verificationCodes.delete(phoneNumber);

  res.json({
    success: true,
    message: "Numéro de téléphone vérifié avec succès",
  });
});

// Route pour renvoyer un code de vérification
app.post("/api/auth/resend-verification", (req, res) => {
  const { phoneNumber } = req.body;

  console.log("Renvoi du code de vérification pour:", phoneNumber);

  // Générer un nouveau code
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

  // Mettre à jour ou créer l'entrée
  verificationCodes.set(phoneNumber, {
    code: verificationCode,
    expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    attempts: 0,
  });

  console.log(
    `Nouveau code de vérification pour ${phoneNumber}: ${verificationCode}`
  );

  res.json({
    success: true,
    message: "Nouveau code de vérification envoyé",
    developmentCode: verificationCode,
  });
});

// Route pour rafraîchir le token
app.post("/api/auth/refresh", authenticateToken, (req, res) => {
  const userId = req.userId;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur non trouvé",
    });
  }

  // Générer un nouveau token
  const newToken = generateToken(userId);

  // Mettre à jour le statut de l'utilisateur
  user.lastSeen = Date.now();
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    token: newToken,
    user: userWithoutPassword,
  });
});

// Route pour obtenir le profil utilisateur
app.get("/api/user/profile", authenticateToken, (req, res) => {
  const userId = req.userId;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur non trouvé",
    });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword,
  });
});

// Route pour mettre à jour le profil utilisateur
app.put("/api/user/profile", authenticateToken, (req, res) => {
  const userId = req.userId;
  const { name, status, profilePicture } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Utilisateur non trouvé",
    });
  }

  // Mettre à jour les champs modifiables
  if (name) user.name = name;
  if (status) user.status = status;
  if (profilePicture) user.profilePicture = profilePicture;
  user.lastSeen = Date.now();
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    success: true,
    user: userWithoutPassword,
    message: "Profil mis à jour avec succès",
  });
});

// Route pour obtenir la liste des utilisateurs connectés
app.get("/api/user/online", authenticateToken, (req, res) => {
  const onlineUsers = users
    .filter((u) => u.isOnline && u.id !== req.userId)
    .map((u) => {
      const { password: _, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  res.json({
    success: true,
    users: onlineUsers,
  });
});
