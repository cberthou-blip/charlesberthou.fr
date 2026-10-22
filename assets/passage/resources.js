/* Amélioration progressive : la lecture et les panneaux fonctionnent sans JS. */
(() => {
  'use strict';
  const index = document.getElementById('choisir-usage');

  function openLinkedResource() {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      return;
    }
    const target = document.getElementById(id);
    const entry = target?.closest('.resource-entry');
    if (!entry && target !== index) return false;
    if (!target) return false;
    if (entry) {
      const details = entry.querySelector('.resource-details');
      if (details) details.open = true;
    }
    const promptBlock = target.closest('.resource-prompt');
    if (promptBlock) promptBlock.querySelector('.prompt-disclosure').open = true;
    // Ouvre aussi les panneaux imbriqués pour conserver les anciennes ancres.
    let panel = target.closest('details');
    while (panel) {
      panel.open = true;
      panel = panel.parentElement?.closest('details');
    }
    if (target === index) {
      index.focus({ preventScroll: true });
    } else if (target === entry) {
      target.querySelector('summary')?.focus({ preventScroll: true });
    }
    // Une ancre vers le texte doit laisser le bouton de copie dans l’écran.
    (promptBlock || target).scrollIntoView({ block: 'start' });
    return true;
  }

  openLinkedResource();
  window.addEventListener('hashchange', openLinkedResource);
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link && link.hash === window.location.hash && openLinkedResource()) {
      event.preventDefault();
    }
  });

  document.querySelectorAll('.guide-close').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', () => {
      const details = button.closest('.resource-details');
      details.open = false;
      details.querySelector('summary').focus({ preventScroll: true });
      details.closest('.resource-entry').scrollIntoView({ block: 'start' });
    });
  });

  if (!navigator.clipboard?.writeText) return;

  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const prompt = document.getElementById(button.dataset.copy);
      const feedback = button.closest('.resource-prompt').querySelector('.copy-feedback');
      if (!prompt || !feedback) return;
      button.disabled = true;
      feedback.textContent = '';
      try {
        await navigator.clipboard.writeText(prompt.textContent);
        feedback.textContent = 'Prompt copié. Collez-le dans votre assistant IA pour commencer.';
      } catch {
        button.closest('.resource-prompt').querySelector('.prompt-disclosure').open = true;
        feedback.textContent = 'La copie automatique est indisponible. Sélectionnez le texte du prompt pour le copier.';
      } finally {
        button.disabled = false;
      }
    });
  });
})();
