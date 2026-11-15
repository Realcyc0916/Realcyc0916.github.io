// 一言（Hitokoto）：开启 slogan_hitokoto 后，客户端请求 hitokoto.cn
// 随机一言替换首页 slogan，仅取诗词分类（c=i，唐诗/宋词等古诗文）。
// 静态 slogan 已在 DOM 中作为回退（SEO 友好、JS 未执行或请求失败时仍可见），
// 此处仅在成功时替换文本。
(function () {
  var el = document.getElementById('hitokoto-slogan');
  if (!el) return;

  var controller = new AbortController();
  var timer = setTimeout(function () { controller.abort(); }, 5000);

  fetch('https://v1.hitokoto.cn/?c=i', { signal: controller.signal })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      if (data && data.hitokoto) {
        el.textContent = data.hitokoto;
      }
    })
    .catch(function () {
      // 保留 DOM 中的静态 slogan 作为回退
    })
    .finally(function () {
      clearTimeout(timer);
    });
})();
