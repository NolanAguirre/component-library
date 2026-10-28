import { useCallback, useSyncExternalStore } from 'react'

const supported = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'

const useMediaQuery = (query) => {
  const subscribe = useCallback((notify) => {
    if (!supported()) return () => {}
    const list = window.matchMedia(query)
    list.addEventListener('change', notify)
    return () => list.removeEventListener('change', notify)
  }, [query])
  const snapshot = () => supported() && window.matchMedia(query).matches
  return useSyncExternalStore(subscribe, snapshot, () => false)
}

export default useMediaQuery
