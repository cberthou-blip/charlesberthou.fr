/* Les anciens liens profonds rejoignent le même contenu dans son guide. */
(() => {
  'use strict';
  const data = document.getElementById('resource-guide-links');
  if (!data) return;
  let links;
  try { links = JSON.parse(data.textContent); } catch { return; }
  function followLegacyLink() {
    let id;
    try { id = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
    if (!Object.prototype.hasOwnProperty.call(links, id)) return;
    const destination = links[id];
    if (typeof destination === 'string' && destination.startsWith('/ressources/')) {
      window.location.replace(destination);
    }
  }
  followLegacyLink();
  window.addEventListener('hashchange', followLegacyLink);
})();
