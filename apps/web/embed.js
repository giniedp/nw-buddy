;(function (doc) {
  const registry = new Map()
  if (doc.readyState === 'interactive' || doc.readyState === 'complete') {
    observe()
  } else {
    doc.addEventListener('DOMContentLoaded', observe)
  }
  function register(el) {
    if ((el instanceof HTMLObjectElement || el instanceof HTMLIFrameElement) && el.contentWindow) {
      registry.set(el.contentWindow, el)
    }
  }
  function unregister(el) {
    if (el instanceof HTMLObjectElement || el instanceof HTMLIFrameElement) {
      const found = Array.from(registry.entries()).find(([_, it]) => it === el)
      if (found === null || found === void 0 ? void 0 : found.length) {
        registry.delete(found[0])
      }
    }
  }
  function updateHeight(message) {
    var _a
    const data = message.data
    if (
      (data === null || data === void 0 ? void 0 : data.type) !== 'nw-buddy-resize' ||
      !((_a = message.data) === null || _a === void 0 ? void 0 : _a.height)
    ) {
      return
    }
    const el = registry.get(message.source)
    if (!el) {
      return
    }
    el.style.height = Math.ceil(data.height) + `px`
  }
  function observe() {
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach(register)
        record.removedNodes.forEach(unregister)
      }
    })
    observer.observe(doc.body, {
      childList: true,
      subtree: true,
    })
    doc.querySelectorAll('object,iframe').forEach(register)
    window.addEventListener('message', updateHeight)
  }
})(document)
