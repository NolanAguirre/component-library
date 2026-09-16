import { DevScope } from '../DevInspector/devInspector.jsx'
import './styles.css'

/**
 * OrderDisplay — pure display controller.
 *
 * Renders up/down reorder controls for an ordered item.
 * No local state — callers are expected to handle movement via network
 * requests and re-render with updated `order` and `totalCount` props.
 *
 * Props:
 *   id          {string|number} — identifier of the item being reordered
 *   order       {number}        — current position of the item (1-based)
 *   totalCount  {number}        — total number of items; used to derive isLast
 *   updating    {boolean}       — disables both controls while a request is in flight
 *   move        {function}      — triggers a position change; receives (id, direction)
 *                                 where direction is 'up' or 'down'
 */
export const OrderDisplay = ({
  id,
  order,
  totalCount,
  updating = false,
  move = () => {},
}) => (
  <div className="order" aria-label={`Order position ${order}`}>
    <DevScope id="u4n8q2c">
      <button
        className="order__btn order__btn--up"
        onClick={() => move(id, 'up')}
        disabled={order === 1 || updating}
        aria-label="Move up"
      >
        ▲
      </button>
    </DevScope>
    <span className="order__position">{order}</span>
    <DevScope id="r7w3k9p">
      <button
        className="order__btn order__btn--down"
        onClick={() => move(id, 'down')}
        disabled={order === totalCount || updating}
        aria-label="Move down"
      >
        ▼
      </button>
    </DevScope>
  </div>
)

export default OrderDisplay
