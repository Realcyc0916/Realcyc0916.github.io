// 樱花飘落：全站背景装饰。花瓣为 DOM 元素 + CSS 动画（合成器执行，不占主线程），
// JS 仅负责随机化参数（位置/大小/时长/摇摆幅度），由 sakura.enable 控制加载。
// 密度经 #sakura-layer[data-density] 传入，移动端自动减半；
// prefers-reduced-motion 用户由 _theme.styl 全局规则禁用动画（花瓣静止在视口外，等效关闭）。
(function () {
  var layer = document.getElementById('sakura-layer');
  if (!layer) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var density = parseInt(layer.getAttribute('data-density'), 10) || 16;
  if (window.innerWidth < 768) density = Math.ceil(density / 2); // 移动端减半，控制开销

  var fragment = document.createDocumentFragment();
  for (var i = 0; i < density; i++) {
    var petal = document.createElement('span');
    petal.className = 'petal';
    var size = 8 + Math.random() * 6;            // 8-14px
    var duration = 9 + Math.random() * 7;        // 9-16s 一个下落周期
    petal.style.cssText =
      '--x:' + (Math.random() * 100).toFixed(1) + 'vw' +
      ';--size:' + size.toFixed(1) + 'px' +
      ';--d:' + duration.toFixed(1) + 's' +
      // 负延迟让首屏就有均匀分布，无需等待完整周期
      ';--delay:-' + (Math.random() * duration).toFixed(1) + 's' +
      ';--sway:' + (30 + Math.random() * 50).toFixed(0) + 'px' +
      ';--rot:' + (Math.random() > 0.5 ? '' : '-') + (1 + Math.random()).toFixed(1) + 'turn' +
      ';--o:' + (0.5 + Math.random() * 0.35).toFixed(2);
    fragment.appendChild(petal);
  }
  layer.appendChild(fragment);
})();
