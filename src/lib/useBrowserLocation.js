import { useSyncExternalStore } from 'react'

const locationEvent = 'library:locationchange'
const snapshot = () => window.location.href
const subscribe = (notify) => {
  window.addEventListener('popstate', notify)
  window.addEventListener('hashchange', notify)
  window.addEventListener(locationEvent, notify)
  return () => {
    window.removeEventListener('popstate', notify)
    window.removeEventListener('hashchange', notify)
    window.removeEventListener(locationEvent, notify)
  }
}

const navigate = (href, { replace = false } = {}) => {
  const url = new URL(href, window.location.href)
  if (url.href === window.location.href) return
  window.history[replace ? 'replaceState' : 'pushState'](null, '', url.href)
  window.dispatchEvent(new Event(locationEvent))
}

const useBrowserLocation = () => {
  const href = useSyncExternalStore(subscribe, snapshot, () => 'http://localhost/')
  return { url: new URL(href), navigate }
}

export default useBrowserLocation
