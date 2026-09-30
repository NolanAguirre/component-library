import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

const PALETTE = ['#6ea8fe', '#3fb950', '#d29922', '#f85149', '#a371f7', '#39c5cf', '#ff7b72', '#e3b341', '#7ee787', '#d2a8ff', '#8b949e']

const defaultFormat = (value) => String(value)

/**
 * BarChart — stateless stacked column chart.
 *
 * Each bar stacks one segment per series, scaled against the tallest bar
 * total. Series without a color take one from a built-in palette.
 *
 * Props:
 *   bars        {Array<{ id, label, values: { [seriesId]: number } }>}
 *   series      {Array<{ id, title, color? }>}  — stacking order, bottom first
 *   height      {number}   — plot height in px (default 160)
 *   label       {string}   — accessible name for the chart
 *   showLegend  {boolean}  — render the series legend (default true)
 *   formatValue {function} — formats numbers in tooltips
 *   select      {function} — optional; called with the bar when clicked
 *   selectedId  {string}   — highlights the matching bar
 *   devId / barDevId       — DevScope ids for the root and each bar
 */
const BarChart = ({
  bars = [],
  series = [],
  height = 160,
  label,
  showLegend = true,
  formatValue = defaultFormat,
  select,
  selectedId,
  className = '',
  devId,
  barDevId,
  ...rest
}) => {
  const colored = series.map((item, i) => ({ ...item, color: item.color || PALETTE[i % PALETTE.length] }))
  const totalOf = (bar) => colored.reduce((sum, item) => sum + (Number(bar.values?.[item.id]) || 0), 0)
  const max = Math.max(1, ...bars.map(totalOf))

  return (
    <DevScope id={devId}>
      <div className={`bar-chart${className ? ` ${className}` : ''}`} role="figure" aria-label={label} {...rest}>
        {showLegend && colored.length > 0 && (
          <ul className="bar-chart__legend">
            {colored.map((item) => (
              <li key={item.id} className="bar-chart__legend-item">
                <span className="bar-chart__swatch" style={{ background: item.color }} />
                {item.title ?? item.id}
              </li>
            ))}
          </ul>
        )}
        <div className="bar-chart__scroll">
          <div className="bar-chart__plot" style={{ height }}>
            {bars.map((bar) => {
              const total = totalOf(bar)
              const tooltip = [
                `${bar.label ?? bar.id}: ${formatValue(total)}`,
                ...colored
                  .filter((item) => Number(bar.values?.[item.id]) > 0)
                  .map((item) => `${item.title ?? item.id}: ${formatValue(bar.values[item.id])}`),
              ].join('\n')
              return (
                <DevScope key={bar.id} id={barDevId} state={{ bar: bar.id }}>
                  <button
                    type="button"
                    className={`bar-chart__bar${bar.id === selectedId ? ' bar-chart__bar--selected' : ''}`}
                    title={tooltip}
                    disabled={!select}
                    onClick={select ? () => select(bar) : undefined}
                  >
                    <span className="bar-chart__stack" style={{ height: `${(total / max) * 100}%` }}>
                      {colored.map((item) => {
                        const value = Number(bar.values?.[item.id]) || 0
                        if (!value) return null
                        return (
                          <span
                            key={item.id}
                            className="bar-chart__segment"
                            style={{ height: `${(value / total) * 100}%`, background: item.color }}
                          />
                        )
                      })}
                    </span>
                  </button>
                </DevScope>
              )
            })}
          </div>
          <div className="bar-chart__labels">
            {bars.map((bar) => (
              <span key={bar.id} className="bar-chart__label" title={bar.label ?? bar.id}>
                {bar.label ?? bar.id}
              </span>
            ))}
          </div>
        </div>
      </div>
    </DevScope>
  )
}

export default BarChart
