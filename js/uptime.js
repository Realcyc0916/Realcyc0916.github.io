// 建站运行时长：根据起始时间在页脚实时显示"已运行 X 天 X 小时 X 分 X 秒"
// 起始时间与文案模板来自 data-* 属性（由 foot.njk 输出），无任何外部请求
(function () {
  var el = document.getElementById('site-uptime');
  if (!el) return;

  var since = new Date(el.getAttribute('data-since') || '');
  if (isNaN(since.getTime())) {
    el.parentNode && el.parentNode.removeChild(el);
    return;
  }

  var tpl = el.getAttribute('data-template') || '本站已运行 {d} 天 {h} 小时 {m} 分 {s} 秒';

  function render() {
    var diff = Math.max(0, Date.now() - since.getTime());
    var s = Math.floor(diff / 1000);
    var days = Math.floor(s / 86400);
    var hours = Math.floor((s % 86400) / 3600);
    var mins = Math.floor((s % 3600) / 60);
    var secs = s % 60;
    var pad = function (n) { return n < 10 ? '0' + n : '' + n; };
    el.textContent = tpl
      .replace('{d}', days)
      .replace('{h}', pad(hours))
      .replace('{m}', pad(mins))
      .replace('{s}', pad(secs));
  }

  render();
  // 每秒一次 textContent 更新，开销可忽略；页面隐藏时显式暂停，回到前台恢复
  var timer = setInterval(render, 1000);
  document.addEventListener('visibilitychange', function () {
    clearInterval(timer);
    if (!document.hidden) {
      render();
      timer = setInterval(render, 1000);
    }
  });
})();
