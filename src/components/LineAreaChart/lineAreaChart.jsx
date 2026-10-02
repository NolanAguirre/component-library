import { useState } from 'react'
import { DevScope } from '../DevInspector/devInspector'

// Small, data-driven chart. Domain labels, markers, and tooltip content belong to callers.
export const LineAreaChartDisplay = ({ series = [], labels = [], max = 2500000, min = 0, tickStep = max / 5, label = 'Line and area chart', formatTick = String, activeIndex = null, select = () => {}, renderTooltip, marker, devId }) => {
  const width = 500, height = 405, left = 70, right = 483, top = marker ? 51 : 30, bottom = marker ? 356 : 338
  const x = (i) => left + (right - left) * i / Math.max(1, labels.length - 1)
  const y = (v) => bottom - (v - min) / (max - min) * (bottom - top)
  const points = (values) => values.map((v, i) => `${x(i)},${y(v)}`).join(' ')
  const first = series[0]?.values ?? []
  const second = series[1]?.values ?? first.map(() => 0)
  return <DevScope id={devId} state={{ activeIndex }}><div className="line-area-chart" style={{ position: 'relative' }}>
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label} onMouseLeave={() => select(null)}>
      {Array.from({length:Math.floor(max/tickStep)+1},(_,i)=>i*tickStep).filter(v=>v>=min&&(!marker||v>0)).map(v=>{return <g key={v}><line x1="34" x2="497" y1={y(v)} y2={y(v)} stroke="#d5d8df" strokeDasharray="3 3"/><text x="27" y={y(v)+4} textAnchor="end" fill="#616978" fontSize="13">{formatTick(v)}</text></g>})}
      <polygon points={`${points(first)} ${[...second].map((v,i)=>`${x(i)},${y(v)}`).reverse().join(' ')}`} fill="#e5eafb" />
      {series.map(s=><polyline key={s.label} points={points(s.values)} fill="none" stroke={s.color} strokeWidth="2.2"/>)}
      {labels.map((label,i)=><g key={label}><text x={x(i)} y="375" textAnchor="middle" fill="#616978" fontSize="13">{label}</text><rect x={x(i)-25} y={top} width={50} height={bottom-top} fill="transparent" tabIndex="0" role="button" aria-label={`Forecast for ${label}`} onMouseEnter={()=>select(i)} onFocus={()=>select(i)} onBlur={()=>select(null)}/></g>)}
      {first.length>0 && <><circle cx={x(0)} cy={y(first[0])} r="12" fill="#98b5f7"/><circle cx={x(0)} cy={y(first[0])} r="6" fill="#3668ef" stroke="white" strokeWidth="2"/>{series[1]&&<circle cx={x(0)} cy={y(second[0])} r="7" fill={series[1].color}/>}</>}
      {marker && <g transform={`translate(${x(0)},${y(first[0])-30})`}><path d="M0 25 L-14 0 A18 18 0 1 1 14 0 Z" fill="#386aed"/><path d="M-9 -5l5-5 4 4 7-7 4 4-7 7 4 4-5 5-5-6-5 6-4-4 5-5z" stroke="white" strokeWidth="1" fill="none"/></g>}
      {activeIndex!==null&&series.map(s=><g key={s.label}><line x1={x(activeIndex)} x2={x(activeIndex)} y1={y(first[activeIndex])} y2={y(second[activeIndex])} stroke="#525866"/><circle cx={x(activeIndex)} cy={y(s.values[activeIndex])} r="7" fill={s.color} stroke="white" strokeWidth="2"/></g>)}
    </svg>
    {activeIndex!==null&&renderTooltip&&<div className="chart-tooltip">{renderTooltip(activeIndex)}</div>}
  </div></DevScope>
}
export const withLineAreaChart = (Display) => ({ defaultActiveIndex = null, ...props }) => {
 const [activeIndex, select] = useState(defaultActiveIndex)
 return <Display activeIndex={activeIndex} select={select} {...props}/>
}
export default withLineAreaChart(LineAreaChartDisplay)
