import { useEffect, useRef, useState } from 'react'
import './styles.css'

/**
 * ScrollingText — one-line viewport that scrolls overflowing text horizontally.
 *
 * Short text stays still. When the content is wider than the viewport, it
 * scrolls left in a continuous loop, like an ad banner.
 *
 * Props:
 *   children   {node}    — text (or inline content) to show
 *   className  {string}  — extra class names on the viewport
 *   ...rest               — spread onto the viewport (title, aria-*)
 */
const ScrollingText = ({ children, className = '', ...rest }) => {
  const viewportRef = useRef(null)
  const copyRef = useRef(null)
  const [motion, setMotion] = useState(null)

  useEffect(() => {
    const viewport = viewportRef.current
    const copy = copyRef.current
    if (!viewport || !copy) return undefined

    const measure = () => {
      const viewWidth = viewport.clientWidth
      const copyWidth = copy.getBoundingClientRect().width
      const extra = copyWidth - viewWidth
      setMotion((current) => {
        if (extra <= 1) return current ? null : current
        const gap = 48
        const distance = copyWidth + gap
        const next = {
          distance,
          gap,
          duration: Math.max(5, distance / 28),
        }
        if (
          current
          && Math.abs(current.distance - next.distance) < 0.5
          && Math.abs(current.gap - next.gap) < 0.5
          && Math.abs(current.duration - next.duration) < 0.05
        ) return current
        return next
      })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(copy)
    return () => observer.disconnect()
  }, [children])

  const classes = ['scrolling-text', motion ? 'scrolling-text--active' : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      ref={viewportRef}
      className={classes}
      style={motion ? {
        '--scrolling-text-distance': `${motion.distance}px`,
        '--scrolling-text-gap': `${motion.gap}px`,
        '--scrolling-text-duration': `${motion.duration}s`,
      } : undefined}
      {...rest}
    >
      <span className="scrolling-text__track">
        <span ref={copyRef} className="scrolling-text__copy">{children}</span>
        {motion && (
          <span className="scrolling-text__copy" aria-hidden="true">{children}</span>
        )}
      </span>
    </span>
  )
}

export default ScrollingText
