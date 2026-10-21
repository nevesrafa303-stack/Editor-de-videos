// Formato vem do hash (#story ou #feed); o logo é injetado inline para herdar a cor via currentColor.
document.body.classList.add(location.hash.slice(1) || 'story');
const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l8 8-8 8"/></svg>';
document.querySelectorAll('.cta, .p-cta').forEach(el => el.insertAdjacentHTML('beforeend', ARROW));
fetch('../assets/amil-logo.svg').then(r => r.text()).then(svg => {
  document.querySelectorAll('.logo').forEach(el => { el.innerHTML = svg; });
  return document.fonts.ready;
}).then(() => { window.__ready = true; });
