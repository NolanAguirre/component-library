import { useLayoutEffect, useRef, useState } from 'react'
import './styles.css'

const resolveRoot = (root) => {
  if (!root) return null
  if (typeof root === 'object' && 'current' in root) return root.current
  return root
}

const isIntersectingNow = (node, rootEl, overscan) => {
  const rect = node.getBoundingClientRect()
  const bounds = rootEl
    ? rootEl.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight }
  return rect.bottom >= bounds.top - overscan && rect.top <= bounds.bottom + overscan
}

/**
 * ViewportGate — mounts children only while they are near a scroller.
 *
 * Keeps native overflow scrolling (no list virtualization) while dropping
 * off-screen work. When children unmount, the last measured height is kept so
 * the scrollbar does not jump.
 *
 * Props:
 *   root      {Ref|Element} — overflow scroller; viewport when omitted
 *   overscan  {number}      — extra px around the scroller to keep mounted
 *   minHeight {string}     — CSS size used before the first measurement
 *   className {string}      — extra class on the wrapper
 */
const ViewportGate = ({
  children,
  root = null,
  overscan = 1500,
  minHeight,
  className = '',
}) => {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const [savedHeight, setSavedHeight] = useState(0)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return undefined

    const rootEl = resolveRoot(root)
    const setVisible = (visible) => {
      if (!visible) {
        const height = node.getBoundingClientRect().height
        if (height > 0) setSavedHeight((prev) => (height > prev ? height : prev))
      }
      setInView((prev) => (prev === visible ? prev : visible))
    }

    setVisible(isIntersectingNow(node, rootEl, overscan))

    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(Boolean(entries[0]?.isIntersecting))
      },
      { root: rootEl, rootMargin: `${overscan}px 0px`, threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [root, overscan])

  const placeholder = savedHeight ? `${savedHeight}px` : minHeight
  const style = placeholder ? { minHeight: placeholder } : undefined

  return (
    <div
      ref={ref}
      className={`viewport-gate${className ? ` ${className}` : ''}`}
      style={style}
    >
      {inView ? children : null}
    </div>
  )
}

export default ViewportGate
