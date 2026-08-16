function createHotContext() {
  return {
    get data() {
      return {}
    },
    accept: function () {},
    acceptExports: function () {},
    dispose: function () {},
    prune: function () {},
    decline: function () {},
    invalidate: function () {},
    on: function () {},
    off: function () {},
    send: function () {},
  }
}

var sheets = new Map()

function updateStyle(id, content) {
  var style = sheets.get(id)
  if (!style) {
    style = document.createElement('style')
    style.setAttribute('data-vite-dev-id', id)
    style.textContent = content
    document.head.appendChild(style)
    sheets.set(id, style)
  } else {
    style.textContent = content
  }
}

function removeStyle(id) {
  var style = sheets.get(id)
  if (style && style.parentNode) style.parentNode.removeChild(style)
  sheets.delete(id)
}

function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url
  var pathname = url.replace(/[?#].*$/, '')
  var parsed = new URL(url, 'http://vite.local')
  return (
    pathname +
    '?' +
    queryToInject +
    (parsed.search ? '&' + parsed.search.slice(1) : '') +
    (parsed.hash || '')
  )
}

function ErrorOverlay() {}

export {
  ErrorOverlay,
  createHotContext,
  injectQuery,
  removeStyle,
  updateStyle,
}
