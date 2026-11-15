// 回到顶部按钮：滚动超过一屏后浮现，点击平滑滚动回顶部
(function () {
  var btn = document.getElementById('back-to-top');
  if (!btn) return;

  var ticking = false;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function updateVisibility() {
    ticking = false;
    if (window.scrollY > window.innerHeight) {
      btn.classList.add('back-to-top--visible');
    } else {
      btn.classList.remove('back-to-top--visible');
    }
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateVisibility);
    }
  }, { passive: true });

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  });

  // 页面加载时可能已滚动（刷新场景），手动触发一次可见性检查
  updateVisibility();
})();
