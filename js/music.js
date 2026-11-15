// 音乐播放器：APlayer（CDN 加载）迷你浮动模式，歌单经 #music-playlist JSON 块传入。
// MPA 切页必然中断播放，这里用 localStorage 记忆曲目与进度，新页恢复到该状态并
// 尝试自动续播；被浏览器自动播放策略拦截时，静默保持暂停在原进度（最接近"不断播"的无后端方案）。
(function () {
  var playlistEl = document.getElementById('music-playlist');
  if (!playlistEl || !window.APlayer) return;

  var songs;
  try {
    songs = JSON.parse(playlistEl.textContent);
  } catch (e) {
    return;
  }
  if (!Array.isArray(songs) || !songs.length) return;

  // 上次播放状态（曲目索引 / 进度 / 是否在播）
  var state = null;
  try {
    state = JSON.parse(localStorage.getItem('tranquility-music') || 'null');
  } catch (e) { /* 隐私模式等场景下读写失败直接忽略 */ }

  var container = document.createElement('div');
  container.id = 'music-player';
  document.body.appendChild(container);

  var player = new APlayer({
    container: container,
    mini: true,  // 迷你模式：左下角圆形按钮
    fixed: true,
    audio: songs
  });

  if (state && typeof state.index === 'number' && songs[state.index]) {
    player.list.switch(state.index);
    player.seek(state.time || 0);
    if (state.playing) {
      // 自动播放策略下大概率被拦截，静默失败即停在原进度
      var p = player.play();
      if (p && typeof p.catch === 'function') p.catch(function () {});
    }
  }

  var save = function () {
    try {
      localStorage.setItem('tranquility-music', JSON.stringify({
        index: player.list.index,
        time: player.audio.currentTime || 0,
        playing: !player.audio.paused
      }));
    } catch (e) { /* 忽略 */ }
  };
  window.addEventListener('pagehide', save);
  setInterval(save, 3000); // 兜底：移动端部分浏览器不触发 pagehide
})();
