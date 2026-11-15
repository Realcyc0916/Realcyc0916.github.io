// 深色模式切换：在 light/dark 之间切换并写入 localStorage，覆盖配置模式
// 实际模式解析（light/dark/auto/time）由 layout.njk 的内联脚本在首屏完成，避免 FOUC
// 本脚本仅负责：按钮交互、auto 模式下监听浏览器偏好变化、图标同步
(function () {
  var MODE = window.__THEME_MODE__ || 'light';
  var overrideKey = 'theme-override';

  // localStorage 在隐私模式/禁用 cookie 下可能抛异常，统一兜底
  function safeGetItem(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSetItem(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function current() {
    return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  }

  function apply(t) {
    document.documentElement.dataset.theme = t;
    syncIcon(t);
  }

  function syncIcon(t) {
    var btn = document.getElementById('theme-toggle');
    if (!btn) return;
    btn.setAttribute('aria-label', t === 'dark' ? '切换到浅色' : '切换到深色');
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    btn.dataset.active = t;
  }

  function toggle() {
    var next = current() === 'dark' ? 'light' : 'dark';
    // 仅在用户主动切换时写入覆盖；auto/time 模式变化时不写
    safeSetItem(overrideKey, next);
    apply(next);
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncIcon(current());
    var btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);

    // auto 模式下跟随系统变化（仅在用户未手动覆盖时）
    if (MODE === 'auto' && window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        if (safeGetItem(overrideKey)) return;
        apply(e.matches ? 'dark' : 'light');
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  });
})();
