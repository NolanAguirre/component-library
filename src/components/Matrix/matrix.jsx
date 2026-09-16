import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

// Stateless table with slots for domain-specific row headings and cell contents.
const Matrix = ({ rows = [], columns = [], rowLabel, label, renderRowHeader, renderCell, className = '', devId, rowDevId, colDevId, ...props }) => (
  <DevScope id={devId}>
    <div className={`matrix ${className}`} role="region" aria-label={label} tabIndex={0} {...props}>
      <table className="matrix__table" aria-label={label}>
        <thead><tr><th scope="col">{rowLabel}</th>{columns.map((column) => <DevScope key={column.id} id={colDevId} state={{ column: column.id }}>
          <th scope="col">{column.title}</th>
        </DevScope>)}</tr></thead>
        <tbody>{rows.map((row) => <DevScope key={row.id} id={rowDevId} state={{ row: row.id }}>
          <tr>
            <th scope="row">{renderRowHeader(row)}</th>
            {columns.map((column) => <td key={column.id}>{renderCell(row, column)}</td>)}
          </tr>
        </DevScope>)}</tbody>
      </table>
    </div>
  </DevScope>
)

export default Matrix
