// 搜索功能：索引懒加载（首次激活搜索才请求），输入实时检索
// 索引加载时一次性完成 HTML 剥离与小写化，搜索仅做字符串匹配，不再逐次重复处理全文
// 通过 script[data-search-index] 传入索引地址，defer 加载后自动初始化，无需内联脚本
;(function () {
  const searchBtn = document.querySelector('#search-btn')
  const searchIpt = document.querySelector('#search-input')
  const searchResult = document.querySelector('#search-result')
  const searchClearBtn = document.querySelector('#search-clear')
  const searchMask = document.querySelector('#search-mask')

  let searchStatus = 0

  function showSearchDialog(loadIndex) {
    if (searchStatus) return
    searchMask.style.display = 'block'
    document.body.style.overflow = 'hidden'
    searchIpt.focus()
    searchStatus = 1
    // 打开弹窗即开始拉取索引；已加载过则为无操作
    loadIndex()
  }

  function closeSearchDialog() {
    if (!searchStatus) return
    searchMask.style.display = 'none'
    document.body.style.overflow = ''
    searchIpt.value = ''
    searchStatus = 0
  }

  function searchInitialize(url) {
    // 入口判空：缺少任一关键元素直接退出，避免后续抛错
    if (!searchBtn || !searchMask || !searchIpt || !searchResult || !searchClearBtn) return

    let index = null
    let indexPromise = null

    // 索引懒加载：单例 Promise 防重复请求；失败后置空允许重试
    function loadIndex() {
      if (indexPromise) return indexPromise

      searchResult.innerHTML = '<div class="search-loading">正在加载搜索索引…</div>'

      const controller = new AbortController()
      const timer = setTimeout(() => { controller.abort() }, 8000)
      indexPromise = fetch(url, { signal: controller.signal })
        .then(res => {
          if (!res.ok) throw new Error('HTTP ' + res.status)
          return res.json()
        })
        .then(res => {
          clearTimeout(timer)
          // 预处理：剥离 HTML、统一小写，仅执行一次；后续每次搜索直接复用
          index = (Array.isArray(res) ? res : []).filter(post => post.content).map(preprocess)
          // 索引就绪时若用户已输入关键词，立即补一次搜索；否则清掉加载提示
          if (searchIpt.value.trim()) doSearch.call(searchIpt)
          else searchResult.innerHTML = ''
          return index
        })
        .catch(err => {
          clearTimeout(timer)
          indexPromise = null
          console.error('search index load failed:', err)
          searchResult.innerHTML = '<div class="search-error">搜索索引加载失败，<a href="javascript:;" id="search-retry">重试</a></div>'
          const retry = document.getElementById('search-retry')
          if (retry) retry.addEventListener('click', loadIndex)
        })
      return indexPromise
    }

    function doSearch() {
      if (this.value.trim().length <= 0) return clearResult()

      // 索引未就绪：触发加载，就绪后会自动执行一次搜索
      if (!index) {
        loadIndex()
        return
      }

      const keywords = this.value.trim().toLowerCase().split(/[\s\-]+/).filter(Boolean)
      renderSearchResult(search(index, keywords), searchResult)
    }

    // 快捷键绑在索引加载之前，加载失败也能用 Ctrl+K / Esc 打开/关闭弹窗
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        if (searchStatus) closeSearchDialog()
        else showSearchDialog(loadIndex)
      }
      if (e.key === 'Escape') closeSearchDialog()
    })

    searchClearBtn.addEventListener('click', () => {
      searchIpt.value = ''
      clearResult()
    })

    searchBtn.addEventListener('click', () => {
      showSearchDialog(loadIndex)
    })

    searchBtn.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        showSearchDialog(loadIndex)
      }
    })

    searchMask.addEventListener('click', e => {
      if (e.target !== searchMask) return
      closeSearchDialog()
    })

    searchIpt.addEventListener('input', debounce(function () {
      doSearch.call(this)
    }))
  }

  function clearResult() {
    searchResult.innerHTML = ''
  }

  // 预处理单篇文章：标题规整、正文剥离 HTML 标签并预生成小写副本
  function preprocess(post) {
    let postTitle = post.title && post.title.trim()
    postTitle = (postTitle && postTitle.length > 0) ? postTitle : 'Untitled'

    const postContent = post.content.trim().replace(/<[^>]+>/g, '')

    return {
      title: postTitle,
      url: post.url,
      content: postContent,
      lowerTitle: postTitle.toLowerCase(),
      lowerContent: postContent.toLowerCase()
    }
  }

  function search(index, keywords) {
    const matchedPost = []

    index.forEach(entry => {
      const matchedContentIndices = []

      keywords.forEach(keyword => {
        const index_title = entry.lowerTitle.indexOf(keyword);
        const index_content = entry.lowerContent.indexOf(keyword);

        if (index_title < 0 && index_content < 0) return

        // 仅在正文命中时记录位置，标题命中用 -1 标记（取正文开头）
        matchedContentIndices.push(index_content >= 0 ? index_content : 0)
      });

      if (matchedContentIndices.length) matchedPost.push({
        url: entry.url,
        content: trimContent(matchedContentIndices, entry, keywords),
        title: entry.title
      })
    });

    return matchedPost
  }

  function renderSearchResult(result, el) {
    el.innerHTML = ''

    if (!result || result.length <= 0) {
      el.innerHTML = '<div class="search-result-empty">无结果</div>'
      return
    }

    const list = document.createDocumentFragment()
    result.forEach(res => {
      const item = document.createElement('a')
      item.className = 'search-result-item'
      item.href = res.url

      const title = document.createElement('div')
      title.className = 'search-result__head'
      title.innerText = res.title

      const content = document.createElement('div')
      content.className = 'search-result__body'
      res.content.forEach(contentText => {
        const contentItem = document.createElement('div')
        contentItem.innerHTML = contentText
        content.appendChild(contentItem)
      })

      item.append(title, content)
      list.append(item)
    })

    el.appendChild(list)
  }

  // 词元边界（[start, end] 区间列表）按文章惰性计算并缓存：仅命中搜索的文章需要，
  // 每篇至多计算一次，后续搜索直接复用
  function tokensOf(entry) {
    if (!entry.tokens) {
      // 不使用 d 标志（hasIndices），兼容更多浏览器；手动计算区间
      const reg = /[\u4e00-\u9fa5]|\w+/g
      const splitIndex = []
      let arr
      while ((arr = reg.exec(entry.content)) !== null)
        splitIndex.push([arr.index, arr.index + arr[0].length])
      entry.tokens = splitIndex
    }
    return entry.tokens
  }

  function trimContent(keyIndexs, entry, keywords, wordLen = 20) {
    const content = entry.content
    const splitIndex = tokensOf(entry)

    return keyIndexs.map(key => {
      // 内容无可用词元（纯标点/emoji 等）时，直接截取开头作为摘要
      if (splitIndex.length === 0) {
        let snippet = content.slice(0, wordLen * 2)
        snippet = snippet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        return highlightKeyword(snippet, keywords)
      }

      const pos = binaryFind(splitIndex, key)
      const wordStart = Math.max(0, pos - 10)
      const wordEnd = Math.min(wordLen + wordStart, splitIndex.length - 1)
      const start = splitIndex[wordStart][0]
      const end = splitIndex[wordEnd][1]
      let snippet = content.slice(start, end)
      // 先转义 HTML，避免摘要中的 < > & 被当作标签解析（XSS 防护）
      snippet = snippet.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return highlightKeyword(snippet, keywords)
    })
  }

  function highlightKeyword(snippet, keywords) {
    keywords.forEach(keyword => {
      // 转义正则元字符，避免用户输入 ( ) [ ] * 等导致报错
      const safe = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      snippet = snippet.replace(new RegExp(safe, 'ig'),
        function (m) { return '<span class="search-keyword">' + m + '</span>' })
    })
    return snippet
  }

  function binaryFind(arr, value) {
    let i = 0, j = arr.length - 1, mid = j
    while (i <= j) {
      if (value < arr[mid][0]) j = mid - 1;
      else if (value > arr[mid][1]) i = mid + 1
      else return mid
      mid = Math.floor((i + j) / 2)
    }
    return mid
  }

  function debounce(fn, t = 400) {
    let timer = null
    return function (...args) {
      clearTimeout(timer)
      timer = setTimeout(() => {
        fn.call(this, ...args)
      }, t)
    }
  }

  function bootstrap() {
    const el = document.querySelector('script[data-search-index]')
    const url = el && el.getAttribute('data-search-index')
    if (url) searchInitialize(url)
  }

  // defer 脚本在 DOM 解析完成后执行，元素已就绪；
  // 若被以非 defer 方式引入（如用户自定义模板），兜底 DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap)
  } else {
    bootstrap()
  }
})();
