// src/main.js
import './style.css';
import javascriptLogo from './javascript.svg';
import viteLogo from '/vite.svg';
import { setupCounter } from './counter.js';
import { io } from 'socket.io-client';

// Importez le client Socket.IO
// Initialisez la connexion Socket.IO
const socket = io('http://localhost:4000');

// Écoutez les événements du serveur
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

socket.on('chat message', (msg) => {
  console.log('Received message: ' + msg);
  // Ici, vous afficherez le message dans l'interface utilisateur
});

document.querySelector('#app').innerHTML = `
  <div>
    <a href="https://vitejs.dev" target="_blank">
      <img src="${viteLogo}" class="logo" alt="Vite logo" />
    </a>
    <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript" target="_blank">
      <img src="${javascriptLogo}" class="logo vanilla" alt="JavaScript logo" />
    </a>
    <h1>Hello Vite!</h1>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <p class="read-the-docs">
      Click on the Vite logo to learn more
    </p>
  </div>
`;

setupCounter(document.querySelector('#counter'));

// Exemple: Envoyer un message après 5 secondes
setTimeout(() => {
  socket.emit('chat message', 'Hello from client!');
}, 5000);
