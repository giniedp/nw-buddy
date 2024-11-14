;(function (doc: Document) {
  const registry = new Map<Window, HTMLObjectElement | HTMLIFrameElement>()
  if (doc.readyState === 'interactive' || doc.readyState === 'complete') {
    observe()
  } else {
    doc.addEventListener('DOMContentLoaded', observe)
  }
  function register(el: Node) {
    if ((el instanceof HTMLObjectElement || el instanceof HTMLIFrameElement) && el.contentWindow) {
      registry.set(el.contentWindow, el)
    }
  }
  function unregister(el: Node) {
    if ((el instanceof HTMLObjectElement || el instanceof HTMLIFrameElement)) {
      const found = Array.from(registry.entries()).find(([_, it]) => it === el)
      if (found?.length) {
        registry.delete(found[0])
      }
    }
  }
  function updateHeight(message: MessageEvent<{ type: string; height: number }>) {
    const data = message.data
    if (data?.type !== 'nw-buddy-resize' || !message.data?.height) {
      return
    }
    const el = registry.get(message.source as Window)
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
