import { createElement, useEffect } from 'react'
import Grid from '../Grid/grid'
import VirtualGrid from '../VirtualGrid/virtualGrid'
import Media from '../Media/media'
import { PopupDisplay } from '../Popup/popup'
import { withMultiSelect } from '../MultiSelect/multiSelect'
import Skeleton from '../Skeleton/skeleton'
import './styles.css'

const TILE_MIN_WIDTH = 12
const TILE_GAP = 0.75

const MediaPickerTile = ({
  item,
  index,
  getMedia,
  getItemKey,
  isSelected,
  select,
  tileAction,
  tileCaption,
}) => {
  const selectedTile = isSelected(getItemKey(item, index))
  const mediaProps = getMedia(item, index)

  return (
    <div
      role="button"
      tabIndex={0}
      className={`media-picker__tile${selectedTile ? ' media-picker__tile--selected' : ''}`}
      onClick={(event) => select(item, event)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') select(item, event)
      }}
    >
      <Media {...mediaProps} variant="thumbnail" className="media-picker__media" />
      {selectedTile && <span className="media-picker__check">✓</span>}
      {tileAction && <div className="media-picker__tile-action">{tileAction(item, index)}</div>}
      {tileCaption && <div className="media-picker__tile-caption">{tileCaption(item, index)}</div>}
    </div>
  )
}

/**
 * MediaPickerDisplay — pure display controller.
 *
 * Renders a Popup panel containing a grid of selectable Media tiles and a
 * confirm action. App-agnostic: the app supplies `items`, a `getMedia`
 * adapter, and a `confirm` handler that receives the chosen raw items.
 *
 * Selection state is injected via the `multiSelect` namespace (see withMultiSelect).
 */
export const MediaPickerDisplay = ({
  items = [],
  getMedia = (item) => item || {},
  getItemKey = (item, index) => item?.id || item?.url || index,
  tileAction = null,
  tileCaption = null,
  isOpen = false,
  close = () => {},
  confirm = () => {},
  multiple = true,
  loading = false,
  title = 'Select media',
  subtitle = null,
  toolbar = null,
  confirmLabel = 'Add selected',
  emptyText = 'No media available',
  multiSelect: { selected = [], add = () => {}, clear = () => {}, set = () => {}, setItems = () => {}, isSelected = () => false } = {},
}) => {
  useEffect(() => {
    setItems(items.map((item, index) => ({ ...item, id: getItemKey(item, index) })))
  }, [items, getItemKey, setItems])

  if (!isOpen) return null

  const handleTileClick = (item, event) => {
    const entity = { id: getItemKey(item), value: item }

    if (multiple) {
      add(entity, event)
      return
    }

    if (isSelected(entity.id)) {
      set([])
    } else {
      set([entity])
    }
  }

  const handleConfirm = () => {
    confirm(selected.map((entry) => entry.value))
  }

  return (
    <PopupDisplay
      isOpen
      close={close}
      lockScroll
      panelClassName="popup__panel--media-picker"
    >
      <div className="media-picker">
        <div className="media-picker__header">
          <h2 className="media-picker__title">{title}</h2>
          {subtitle && <p className="media-picker__subtitle">{subtitle}</p>}
          {toolbar && <div className="media-picker__toolbar">{toolbar}</div>}
        </div>
        <div className="media-picker__body">
          {loading ? (
            <Grid
              data={Array.from({ length: 12 })}
              minItemWidth={TILE_MIN_WIDTH}
              gap={TILE_GAP}
              className="media-picker__grid media-picker__grid--loading"
            >
              <Skeleton shape="media" />
            </Grid>
          ) : items.length === 0 ? (
            <div className="media-picker__empty">{emptyText}</div>
          ) : (
            <VirtualGrid
              data={items}
              minItemWidth={TILE_MIN_WIDTH}
              gap={TILE_GAP}
              useWindowScroll={false}
              height="100%"
              className="media-picker__grid"
            >
              <MediaPickerTile
                getMedia={getMedia}
                getItemKey={getItemKey}
                isSelected={isSelected}
                select={handleTileClick}
                tileAction={tileAction}
                tileCaption={tileCaption}
              />
            </VirtualGrid>
          )}
        </div>
        <div className="media-picker__footer">
          <span className="media-picker__count">{selected.length} selected</span>
          <button
            type="button"
            className="media-picker__clear"
            onClick={clear}
            disabled={selected.length === 0}
          >
            Clear
          </button>
          <button type="button" className="media-picker__cancel" onClick={close}>
            Cancel
          </button>
          <button
            type="button"
            className="media-picker__confirm"
            onClick={handleConfirm}
            disabled={selected.length === 0}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </PopupDisplay>
  )
}

const MediaPicker = withMultiSelect(({ selected, add, clear, set, setItems, isSelected, ...props }) =>
  createElement(MediaPickerDisplay, {
    multiSelect: { selected, add, clear, set, setItems, isSelected },
    ...props,
  })
)

export default MediaPicker
