document.addEventListener('DOMContentLoaded', () => {
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // 回退到 execCommand，兼容非安全上下文（HTTP）或旧浏览器
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (e) {
        reject(e);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  const getCopyButton = () => {
    const button = document.createElement("button")
    button.type = 'button'
    button.textContent = '复制代码'
    button.className = 'copy-button'
    return button
  }

  const codeBlocks = document.querySelectorAll('figure.highlight')

  codeBlocks.forEach((codeBlock) => {
    const copyButton = getCopyButton();
    copyButton.onclick = async () => {
      try {
        const codeEl = codeBlock.querySelector('code');
        if (!codeEl) throw new Error('no code element');
        await copyText(codeEl.innerText);
        copyButton.innerText = '已复制!'
      } catch (err) {
        console.warn('复制失败:', err && err.message);
        copyButton.innerText = '发生错误'
      } finally {
        setTimeout(() => {
          copyButton.innerText = '复制代码'
        }, 1000)
      }
    }
    codeBlock.appendChild(copyButton)
  })
})
