import { initializeApp } from './src/core/appController.js';

document.addEventListener('DOMContentLoaded', () => {
  try {
    initializeApp();
  } catch (err) {
    console.error('[App] Failed to initialize:', err);
  }
});


