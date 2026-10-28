import { useMemo, useRef } from 'react'
import Canvas, { CanvasSurface, CanvasControls } from '../Canvas/canvas'
import { DevScope } from '../DevInspector/devInspector'
import './styles.css'

const PADDING = 120
const NODE_RADIUS = 28
const ITERATIONS = 300

// Small spring/repulsion layout. Seeds from previous positions so adding a node does not reshuffle
// the whole graph. O(n²) per iteration — fine for a few hundred nodes.
const layoutGraph = (nodes, edges, previous) => {
  const points = new Map(nodes.map((node, i) => {
    const seed = previous.get(node.id)
    const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2
    return [node.id, seed ? { ...seed } : { x: Math.cos(angle) * 200 + i, y: Math.sin(angle) * 200 - i }]
  }))
  const links = edges.filter((edge) => points.has(edge.source) && points.has(edge.target))
  const ids = [...points.keys()]

  for (let step = 0; step < ITERATIONS; step += 1) {
    const heat = 1 - step / ITERATIONS
    const force = new Map(ids.map((id) => [id, { x: 0, y: 0 }]))

    for (let i = 0; i < ids.length; i += 1) {
      for (let j = i + 1; j < ids.length; j += 1) {
        const a = points.get(ids[i])
        const b = points.get(ids[j])
        const dx = a.x - b.x || 0.01
        const dy = a.y - b.y || 0.01
        const distance2 = Math.max(dx * dx + dy * dy, 100)
        const push = 40000 / distance2
        const distance = Math.sqrt(distance2)
        force.get(ids[i]).x += (dx / distance) * push
        force.get(ids[i]).y += (dy / distance) * push
        force.get(ids[j]).x -= (dx / distance) * push
        force.get(ids[j]).y -= (dy / distance) * push
      }
    }

    for (const edge of links) {
      const a = points.get(edge.source)
      const b = points.get(edge.target)
      const dx = b.x - a.x
      const dy = b.y - a.y
      const pull = (Math.sqrt(dx * dx + dy * dy) - 160) * 0.05
      const distance = Math.sqrt(dx * dx + dy * dy) || 1
      force.get(edge.source).x += (dx / distance) * pull
      force.get(edge.source).y += (dy / distance) * pull
      force.get(edge.target).x -= (dx / distance) * pull
      force.get(edge.target).y -= (dy / distance) * pull
    }

    for (const id of ids) {
      const point = points.get(id)
      const f = force.get(id)
      // Weak gravity keeps disconnected components from drifting away.
      f.x -= point.x * 0.01
      f.y -= point.y * 0.01
      const length = Math.sqrt(f.x * f.x + f.y * f.y) || 1
      const move = Math.min(length, 30 * heat + 1)
      point.x += (f.x / length) * move
      point.y += (f.y / length) * move
    }
  }

  return points
}

const fitWorld = (points) => {
  if (!points.size) return { offset: { x: 0, y: 0 }, world: { width: 800, height: 600 } }
  const xs = [...points.values()].map((point) => point.x)
  const ys = [...points.values()].map((point) => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  return {
    offset: { x: PADDING - minX, y: PADDING - minY },
    world: {
      width: Math.max(Math.max(...xs) - minX + PADDING * 2, 800),
      height: Math.max(Math.max(...ys) - minY + PADDING * 2, 600),
    },
  }
}

/**
 * GraphDisplay — pure display of a laid-out node/edge graph on a pannable Canvas.
 *
 * Props:
 *   positioned {array}    — [{ id, label, x, y, tone }] nodes in world px
 *   lines      {array}    — [{ id, label, from: {x,y}, to: {x,y}, active }]
 *   world      {object}   — { width, height } for the Canvas
 *   selected   {string}   — active node id
 *   height     {string}   — CSS height of the viewport
 *   click      {function} — Canvas click(worldPoint) handler
 *   devId      {string}   — instance-root DevScope id
 *   children              — extra overlays, rendered after the controls
 */
export const GraphDisplay = ({
  positioned = [],
  lines = [],
  world = { width: 800, height: 600 },
  selected = null,
  height = '32rem',
  click = () => {},
  devId,
  children,
}) => {
  const node = (
    <div className="graph">
      <Canvas world={world} height={height} click={click}>
        <CanvasSurface>
          <svg className="graph__edges" width={world.width} height={world.height}>
            <defs>
              <marker id="graph-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" className="graph__arrow" />
              </marker>
            </defs>
            {lines.map((line) => {
              const dx = line.to.x - line.from.x
              const dy = line.to.y - line.from.y
              const length = Math.sqrt(dx * dx + dy * dy) || 1
              const end = { x: line.to.x - (dx / length) * NODE_RADIUS, y: line.to.y - (dy / length) * NODE_RADIUS }
              return (
                <g key={line.id} className={line.active ? 'graph__edge graph__edge--active' : 'graph__edge'}>
                  <line x1={line.from.x} y1={line.from.y} x2={end.x} y2={end.y} markerEnd="url(#graph-arrow)" />
                  {line.label && <text x={(line.from.x + line.to.x) / 2} y={(line.from.y + line.to.y) / 2 - 4}>{line.label}</text>}
                </g>
              )
            })}
          </svg>
          {positioned.map((item) => (
            <div
              key={item.id}
              className={[
                'graph__node',
                item.tone ? `graph__node--${item.tone}` : '',
                item.id === selected ? 'graph__node--selected' : '',
              ].filter(Boolean).join(' ')}
              style={{ left: `${item.x}px`, top: `${item.y}px`, width: `${NODE_RADIUS * 2}px`, height: `${NODE_RADIUS * 2}px` }}
            >
              <span className="graph__label">{item.label}</span>
            </div>
          ))}
        </CanvasSurface>
        <CanvasControls />
      </Canvas>
      {children}
    </div>
  )
  return devId ? <DevScope id={devId}>{node}</DevScope> : node
}

/**
 * withGraph — layout controller HOC.
 *
 * Props:
 *   nodes    {array}    — [{ id, label, tone }]
 *   edges    {array}    — [{ id, source, target, label }]
 *   selected {string}   — active node id; its edges are highlighted
 *   select   {function} — select(id | null) when a node or empty space is clicked
 */
export const withGraph = (WrappedComponent) => {
  const GraphState = ({ nodes = [], edges = [], selected = null, select = () => {}, ...props }) => {
    const previousRef = useRef(new Map())

    const { positioned, lines, world } = useMemo(() => {
      const points = layoutGraph(nodes, edges, previousRef.current)
      previousRef.current = points
      const { offset, world } = fitWorld(points)
      const at = (id) => {
        const point = points.get(id)
        return { x: point.x + offset.x, y: point.y + offset.y }
      }
      return {
        world,
        positioned: nodes.map((node) => ({ ...node, ...at(node.id) })),
        lines: edges
          .filter((edge) => points.has(edge.source) && points.has(edge.target))
          .map((edge) => ({ id: edge.id, label: edge.label, from: at(edge.source), to: at(edge.target), source: edge.source, target: edge.target })),
      }
    }, [nodes, edges])

    const click = (point) => {
      let best = null
      let bestDistance = NODE_RADIUS * NODE_RADIUS
      for (const item of positioned) {
        const distance = (item.x - point.x) ** 2 + (item.y - point.y) ** 2
        if (distance <= bestDistance) {
          best = item.id
          bestDistance = distance
        }
      }
      select(best)
    }

    return (
      <WrappedComponent
        positioned={positioned}
        lines={lines.map((line) => ({ ...line, active: Boolean(selected) && (line.source === selected || line.target === selected) }))}
        world={world}
        selected={selected}
        click={click}
        {...props}
      />
    )
  }

  return GraphState
}

export default withGraph(GraphDisplay)
