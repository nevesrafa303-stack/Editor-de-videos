/* Roda antes da pintura: marca JS ativo, movimento reduzido e intro (1x por sessão, só em telas grandes). */
(function (d) {
  var h = d.documentElement;
  h.classList.remove('no-js');
  h.classList.add('js');
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) h.classList.add('reduced');
  try {
    if (!reduced && window.innerWidth > 900 && !sessionStorage.getItem('lq-intro')) {
      h.classList.add('intro');
      sessionStorage.setItem('lq-intro', '1');
    }
  } catch (e) { /* storage bloqueado: segue sem intro */ }
})(document);
