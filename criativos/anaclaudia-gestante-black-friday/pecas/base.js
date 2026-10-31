// Formato vem do hash (#story ou #feed). O render espera window.__ready (fontes e imagens carregadas).
document.body.classList.add(location.hash.slice(1) || 'story');
Promise.all([
  document.fonts.ready,
  ...[...document.images].map(i => i.decode().catch(() => {})),
]).then(() => { window.__ready = true; });
