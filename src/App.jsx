import { useState } from 'react'
import './App.css'
import ViewSwitch, { ViewSwitchControls, ViewSwitchView, ViewSwitchBack, ViewSwitchNext } from './components/ViewSwitch/viewSwitch'
import Media from './components/Media/media'
import MediaCompare from './components/MediaCompare/mediaCompare'
import MediaLightbox from './components/MediaLightbox/mediaLightbox'
import MediaMagnifier from './components/MediaMagnifier/mediaMagnifier'
import MediaPicker from './components/MediaPicker/mediaPicker'
import OrderingContainer from './components/OrderingContainer/orderingContainer'
import { OrderDisplay } from './components/Order/order'
import Fold, { FoldTrigger, FoldContent } from './components/Fold/fold'
import Card, { CardHeader, CardSection, CardLabel, CardRow } from './components/Card/card'
import Row, { RowHeader, RowSection, RowLabel } from './components/Row/row'
import Section from './storyboard-components/Section/section'
import Popup from './components/Popup/popup'
import Tooltip from './components/Tooltip/tooltip'
import MultiSelect from './components/MultiSelect/multiSelect'
import Checkbox, { CheckboxDisplay } from './components/Checkbox/checkbox'
import { DevScope } from './components/DevInspector/devInspector'
import Drawer from './components/Drawer/drawer'
import LocalBrowser, { LocalBrowserOverlay } from './components/LocalBrowser/localBrowser'
import Map from './components/Map/map'
import VirtualList from './components/VirtualList/virtualList'
import Pagination from './components/Pagination/pagination'
import ProgressBar from './components/ProgressBar/progressBar'
import Skeleton from './components/Skeleton/skeleton'
import Select from './components/Select/select'
import UploadFileRow from './components/UploadFileRow/uploadFileRow'
import Button from './components/Button/button'
import Tabs, { TabList, Tab, TabPanel } from './components/Tabs/tabs'
import Canvas, { CanvasSurface, CanvasMinimap, CanvasControls } from './components/Canvas/canvas'
import Timeline from './components/Timeline/timeline'
import Masonry from './components/Masonry/masonry'
import Grid from './components/Grid/grid'
import VirtualGrid from './components/VirtualGrid/virtualGrid'
import TimelineGraph from './components/TimelineGraph/timelineGraph'
import Form, {
  FormField,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  FormSubmit,
} from './components/Form/form'
import FormToggle from './components/FormToggle/formToggle'
import FormPhone from './components/FormPhone/formPhone'
import FormRadioGroup from './components/FormRadioGroup/formRadioGroup'
import FormCheckboxGroup from './components/FormCheckboxGroup/formCheckboxGroup'
import FormRange from './components/FormRange/formRange'
import FormDate from './components/FormDate/formDate'
import FormFile from './components/FormFile/formFile'
import MultiFileUpload from './components/MultiFileUpload/multiFileUpload'
import FormColorPicker from './components/FormColorPicker/formColorPicker'
import ColorPicker from './components/ColorPicker/colorPicker'
import FormPassword from './components/FormPassword/formPassword'
import FormSearch from './components/FormSearch/formSearch'
import Dropdown from './components/Dropdown/dropdown'
import FormDropdown, { DropdownTypeahead, DropdownTypeaheadTrigger, DropdownTypeaheadMenu } from './components/FormDropdown/formDropdown'
import Typeahead, { TypeaheadInput, TypeaheadList, TypeaheadItem, TypeaheadEmpty } from './components/Typeahead/typeahead'
import GenericForm from './components/GenericForm/genericForm'
import Toast from './components/Toast/toast'
import Badge from './components/Badge/badge'
import BadgeGroup from './components/BadgeGroup/badgeGroup'

const contactConfig = {
  fields: {
    name: {
      type: 'text',
      defaultValue: '',
      required: true,
      minLength: 2,
    },
    email: {
      type: 'email',
      defaultValue: '',
      required: true,
    },
    age: {
      type: 'number',
      defaultValue: '',
      min: 1,
      max: 120,
    },
    role: {
      type: 'select',
      defaultValue: '',
      required: true,
      options: [
        { value: 'inspector', displayValue: 'Safety Inspector' },
        { value: 'supervisor', displayValue: 'Nuclear Supervisor' },
        { value: 'other', displayValue: 'Other' },
      ],
    },
    bio: {
      type: 'textarea',
      defaultValue: '',
      maxLength: 300,
    },
  },
}

const extendedFormConfig = {
  fields: {
    fullName: {
      type: 'text',
      defaultValue: '',
      required: true,
      minLength: 2,
      placeholder: 'Homer Simpson',
    },
    email: {
      type: 'email',
      defaultValue: '',
      required: true,
      placeholder: 'homer@springfield.gov',
    },
    age: {
      type: 'number',
      defaultValue: '',
      min: 1,
      max: 120,
      placeholder: '39',
    },
    notifications: {
      type: 'toggle',
      defaultValue: false,
    },
    phone: {
      type: 'phone',
      defaultValue: '',
    },
    department: {
      type: 'radio',
      defaultValue: '',
      required: true,
      options: [
        { value: 'sector7g', displayValue: 'Sector 7-G' },
        { value: 'safety', displayValue: 'Safety Department' },
        { value: 'cafeteria', displayValue: 'Cafeteria' },
        { value: 'executive', displayValue: 'Executive Suite' },
      ],
    },
    perks: {
      type: 'checkboxGroup',
      defaultValue: [],
      options: [
        { value: 'donuts', displayValue: 'Free Donuts' },
        { value: 'parking', displayValue: 'Parking Spot' },
        { value: 'gym', displayValue: 'Gym Access' },
        { value: 'hammock', displayValue: 'Office Hammock' },
      ],
    },
    satisfaction: {
      type: 'range',
      defaultValue: 50,
      min: 0,
      max: 100,
    },
    startDate: {
      type: 'date',
      defaultValue: '',
    },
    resume: {
      type: 'file',
      defaultValue: null,
    },
    badgeColor: {
      type: 'color',
      defaultValue: '#2563eb',
    },
    password: {
      type: 'password',
      defaultValue: '',
      required: true,
      minLength: 6,
    },
    search: {
      type: 'search',
      defaultValue: '',
    },
    floor: {
      type: 'dropdown',
      defaultValue: '',
      required: true,
      options: [
        { value: 'basement', displayValue: 'Basement' },
        { value: 'ground', displayValue: 'Ground Floor' },
        { value: 'sector7g', displayValue: 'Sector 7-G' },
        { value: 'executive', displayValue: 'Executive Suite' },
        { value: 'rooftop', displayValue: 'Rooftop' },
      ],
    },
  },
}

const ORDER_ITEMS = [
  { id: 'a', label: 'Item A' },
  { id: 'b', label: 'Item B' },
  { id: 'c', label: 'Item C' },
]

const LIGHTBOX_ITEMS = [
  {
    id: 'image',
    name: 'George',
    src: new URL('./assets/george.webp', import.meta.url).href,
    type: 'image',
    extension: 'webp',
  },
  {
    id: 'video',
    name: 'George Wave',
    src: new URL('./assets/george-wave.mp4', import.meta.url).href,
    type: 'video',
    extension: 'mp4',
  },
]

const LOCATION_OPTIONS = [
  { value: 'springfield', displayValue: 'Springfield' },
  { value: 'shelbyville', displayValue: 'Shelbyville' },
  { value: 'ogdenville', displayValue: 'Ogdenville' },
  { value: 'north-haverbrook', displayValue: 'North Haverbrook' },
  { value: 'capital-city', displayValue: 'Capital City' },
  { value: 'cypress-creek', displayValue: 'Cypress Creek' },
  { value: 'brockway', displayValue: 'Brockway' },
  { value: 'waverly-hills', displayValue: 'Waverly Hills' },
  { value: 'little-pwagmattasquarmsettport', displayValue: 'Little Pwagmattasquarmsettport' },
]

const LFT_API_BASE = 'http://localhost:8080/lft'

const TOOLTIP_PLACEMENTS = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
  'left-top',
  'left-center',
  'left-bottom',
  'right-top',
  'right-center',
  'right-bottom',
]

const TOOLTIP_SCOPE_IDS = {
  'top-left': 'q0txsl8',
  'top-center': 'vrhbpy0',
  'top-right': 'i6uzi9d',
  'bottom-left': 'emj89nv',
  'bottom-center': 'rhet0f6',
  'bottom-right': 'pj06vb1',
  'left-top': 'ldwd4xa',
  'left-center': 'mph9np7',
  'left-bottom': 'ldrerm9',
  'right-top': 'r9iqtwu',
  'right-center': 'fvgrvad',
  'right-bottom': 'ywb3r4d',
}

const filterableDropdownFormConfig = {
  fields: {
    location: {
      type: 'dropdown',
      defaultValue: '',
      required: true,
      options: LOCATION_OPTIONS,
    },
  },
}

const handleReorder = ({ id, newOrder, oldOrder }) => {
  // eslint-disable-next-line no-console
  console.log('reorder', { id, newOrder, oldOrder })
}

const OrderItem = ({ id, label, ordering: { order, totalCount, updating, move } = {} }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
    <OrderDisplay
      id={id}
      order={order}
      totalCount={totalCount}
      updating={updating}
      move={move}
    />
    <span style={{ fontSize: '0.9rem', color: '#d1d5db' }}>{label}</span>
  </div>
)

const handleSubmit = (values) => {
  // eslint-disable-next-line no-console
  console.log('Submitted values:', values)
  alert(`Submitted!\n${JSON.stringify(values, null, 2)}`)
}

const handleExtendedSubmit = (values) => {
  // eslint-disable-next-line no-console
  console.log('Extended form submitted:', values)
  alert(`Extended Form Submitted!\n${JSON.stringify(values, null, 2)}`)
}

const ButtonLoadingDemo = () => {
  const [loading, setLoading] = useState(false)

  const handleClick = () => {
    setLoading(true)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <DevScope id="qalp7u2">
      <Button variant="primary" loading={loading} onClick={handleClick}>
            Click to Load
          </Button>
    </DevScope>
  )
}

const canvasBoxes = [
  { id: 'a', x: 80, y: 60, width: 320, height: 180, label: 'Establishing shot' },
  { id: 'b', x: 560, y: 140, width: 260, height: 140, label: 'Close up' },
  { id: 'c', x: 1000, y: 80, width: 300, height: 200, label: 'Reverse angle' },
  { id: 'd', x: 240, y: 420, width: 280, height: 160, label: 'Insert' },
  { id: 'e', x: 760, y: 480, width: 360, height: 220, label: 'Wide' },
  { id: 'f', x: 1440, y: 380, width: 300, height: 180, label: 'Finale' }
]

const CanvasDemo = () => {
  const [lastClick, setLastClick] = useState(null)

  return (
    <div>
      <DevScope id="i62ys3t">
        <Canvas
                world={{ width: 2000, height: 800 }}
                height="20rem"
                click={(point) => setLastClick({ x: Math.round(point.x), y: Math.round(point.y) })}
              >
                <CanvasSurface>
                  {canvasBoxes.map((box) => (
                    <div
                      key={box.id}
                      style={{
                        position: 'absolute',
                        left: `${box.x}px`,
                        top: `${box.y}px`,
                        width: `${box.width}px`,
                        height: `${box.height}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '0.125rem solid #4b5563',
                        borderRadius: '0.5rem',
                        background: '#1f2937',
                        color: '#e5e7eb',
                        fontSize: '1.5rem'
                      }}
                    >
                      {box.label}
                    </div>
                  ))}
                </CanvasSurface>
                <CanvasControls />
                <CanvasMinimap>
                  {canvasBoxes.map((box) => (
                    <div
                      key={box.id}
                      style={{
                        position: 'absolute',
                        left: `${box.x}px`,
                        top: `${box.y}px`,
                        width: `${box.width}px`,
                        height: `${box.height}px`,
                        background: '#4b5563',
                        borderRadius: '0.5rem'
                      }}
                    />
                  ))}
                </CanvasMinimap>
              </Canvas>
      </DevScope>
      <p style={{ margin: '0.75rem 0 0', color: '#d1d5db', fontSize: '0.875rem' }}>
        Wheel over the surface to zoom at the pointer, drag empty space to pan both axes, and press
        or drag inside the minimap to move the viewport rectangle. The world is bounded, so it can
        never be flung off screen.
        {lastClick && ` Last click landed at ${lastClick.x}, ${lastClick.y} in world coordinates.`}
      </p>
    </div>
  )
}

const TimelineDemo = () => {
  const [points, setPoints] = useState([
    { id: 'dawn', start: 0, end: 120 },
    { id: 'noon', start: 400, end: 560 },
    { id: 'dusk', start: 780, end: 780 }
  ])
  const [selectedId, setSelectedId] = useState('noon')

  const selected = points.find((point) => point.id === selectedId)

  return (
    <div>
      <DevScope id="bmnip13">
        <Timeline
                points={points}
                selectedId={selectedId}
                select={setSelectedId}
                move={(id, start, end) => {
                  setPoints((current) => current.map((point) => (
                    point.id === id ? { ...point, start, end } : point
                  )))
                }}
                tickCount={5}
                min={0}
                max={1000}
              />
      </DevScope>
      {selected && (
        <p style={{ margin: '0.75rem 0 0', color: '#d1d5db', fontSize: '0.875rem' }}>
          Selected {selected.id} spanning {Math.round(selected.start)} to {Math.round(selected.end)}.
          Drag a bar to move it, drag an edge to resize it.
        </p>
      )}
    </div>
  )
}

const TimelineGraphDemo = () => {
  const [lanes, setLanes] = useState([
    {
      id: 'main',
      label: 'main',
      main: true,
      color: '#60a5fa',
      branchFrom: null,
      points: [
        { id: 'main-1', start: 0, end: 80, label: 'Opening' },
        { id: 'main-2', start: 240, end: 300, label: 'Inciting incident' },
        { id: 'main-3', start: 580, end: 660, label: 'Reunion' },
        { id: 'main-4', start: 840, end: 940, label: 'Finale' }
      ]
    },
    {
      id: 'plot-a',
      label: 'plot A',
      main: false,
      color: '#f472b6',
      branchFrom: { laneId: 'main', pointId: 'main-2' },
      points: [
        { id: 'a-1', start: 340, end: 420, label: 'Escape' },
        { id: 'a-2', start: 470, end: 520, label: 'Betrayal' }
      ]
    },
    {
      id: 'plot-b',
      label: 'plot B',
      main: false,
      color: '#34d399',
      branchFrom: { laneId: 'plot-a', pointId: 'a-1' },
      points: [
        { id: 'b-1', start: 440, end: 500, label: 'Side quest' },
        { id: 'b-2', start: 700, end: 760, label: 'Return' }
      ]
    }
  ])
  const [edges, setEdges] = useState([
    { id: 'merge-1', sourcePointId: 'a-2', targetPointId: 'main-3' }
  ])
  const [selectedId, setSelectedId] = useState('main-2')
  const [activeLaneId, setActiveLaneId] = useState('main')

  const move = (id, start, end) => {
    setLanes((current) => current.map((lane) => ({
      ...lane,
      points: lane.points.map((point) => (point.id === id ? { ...point, start, end } : point))
    })))
  }

  const connect = (sourcePointId, targetPointId) => {
    setEdges((current) => {
      const exists = current.some((edge) => (
        edge.sourcePointId === sourcePointId && edge.targetPointId === targetPointId
      ))
      if (exists) return current
      return [...current, { id: `${sourcePointId}-${targetPointId}`, sourcePointId, targetPointId }]
    })
  }

  const addPoint = (laneId, value) => {
    const start = Math.round(value)
    const id = `${laneId}-${start}`
    setLanes((current) => current.map((lane) => (
      lane.id === laneId
        ? { ...lane, points: [...lane.points, { id, start, end: start + 10, label: 'New Point' }] }
        : lane
    )))
    setSelectedId(id)
  }

  return (
    <div>
      <DevScope id="xrfxaa7">
        <TimelineGraph
                lanes={lanes}
                edges={edges}
                selectedId={selectedId}
                select={setSelectedId}
                activeLaneId={activeLaneId}
                selectLane={setActiveLaneId}
                move={move}
                connect={connect}
                addPoint={addPoint}
              />
      </DevScope>
      <p style={{ margin: '0.75rem 0 0', color: '#d1d5db', fontSize: '0.875rem' }}>
        Drag a bar along its lane to move it, or drag an end node to resize it. Drop a bar on a bar
        in another lane to merge. Click an end node instead of dragging it to arm a link, then click
        a node on a bar in another lane to connect the two; Escape or a click on empty space
        cancels. Dashed edges are forks, solid blue edges are merges. Wheel to zoom, drag empty
        space to pan, use the minimap to jump anywhere in the world, and click an empty lane to add
        a point there. Click a lane name to make it the active lane, which is framed in white. Each
        lane colours its axis and its bars; the selected bar is the opaque one, and in the minimap
        it is the one outlined in white.
      </p>
    </div>
  )
}

const ColorPickerDemo = () => {
  const [palette, setPalette] = useState(['#f97316', '#38bdf8', '#a78bfa', '#34d399'])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [committed, setCommitted] = useState(null)

  const change = (color) => {
    setPalette((current) => current.map((entry, index) => (index === selectedIndex ? color : entry)))
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <DevScope id="szrekat">
          <ColorPicker
                    value={palette[selectedIndex]}
                    change={change}
                    commit={setCommitted}
                    palette={palette}
                    selectedIndex={selectedIndex}
                    selectSwatch={setSelectedIndex}
                  />
        </DevScope>
        <span style={{ color: '#d1d5db', fontSize: '0.875rem' }}>{palette[selectedIndex]}</span>
      </div>
      <p style={{ margin: '0.75rem 0 0', color: '#d1d5db', fontSize: '0.875rem' }}>
        Drag the square or the hue strip, or type a hex value. change fires on every movement, so it
        drives the live preview. commit fires only once a drag ends or the popover closes, so a
        consumer that saves the colour writes once per gesture instead of once per frame.
        Last committed: {committed || 'nothing yet'}. Picking a palette slot switches which entry
        the picker edits.
      </p>
    </div>
  )
}

const ToastDemo = ({ toast: { add } = {} }) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
    <DevScope id="onhh9nc">
      <Button variant="primary" onClick={() => add({ message: 'Record saved successfully!', type: 'success' })}>
            Success
          </Button>
    </DevScope>
    <DevScope id="a3ya2xa">
      <Button variant="danger" onClick={() => add({ message: 'Something went wrong. Please try again.', type: 'error' })}>
            Error
          </Button>
    </DevScope>
    <DevScope id="qjfaecd">
      <Button variant="secondary" onClick={() => add({ message: 'Your session will expire in 5 minutes.', type: 'warning' })}>
            Warning
          </Button>
    </DevScope>
    <DevScope id="fyzixg9">
      <Button variant="ghost" onClick={() => add({ message: 'A new version is available.', type: 'info' })}>
            Info
          </Button>
    </DevScope>
    <DevScope id="jbkak8g">
      <Button variant="secondary" onClick={() => add({ message: 'This notification sticks around.', type: 'info', duration: 0 })}>
            Persistent (no auto-dismiss)
          </Button>
    </DevScope>
  </div>
)

const mockRequestUpload = (file) =>
  new Promise((resolve) => {
    setTimeout(() => resolve({ url: `https://fake-s3.example.com/uploads/${file.name}` }), 800)
  })

const mockComplete = (file) => {
  // eslint-disable-next-line no-console
  console.log('Upload complete:', file.name)
}

const CustomFileRow = ({ multiFileUpload: { files, remove, retry } = {} }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
    {files.map((entry) => (
      <div key={entry.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#d1d5db' }}>
        <span>{entry.status === 'done' ? '[done]' : entry.status === 'failed' ? '[fail]' : `[${entry.progress}%]`}</span>
        <span style={{ flex: 1 }}>{entry.file.name}</span>
        {entry.status === 'failed' && <button onClick={() => retry(entry.id)}>Retry</button>}
        <button onClick={() => remove(entry.id)}>X</button>
      </div>
    ))}
  </div>
)

const OFF_LIST_VARIANT = {
  id: 'off-list-variant',
  name: 'Off-list Variant',
  src: new URL('./assets/george.webp', import.meta.url).href,
  type: 'image',
  extension: 'webp',
}

const MediaLightboxActions = ({
  mediaLightbox: { item, close, isComparing, compare, exitCompare, compareWith, preview, clearPreview, previewItem } = {},
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
    <strong style={{ flex: 1 }}>{previewItem ? `Previewing: ${previewItem.name}` : item?.name}</strong>
    {compare && (
      <DevScope id="h1nj5dc">
        <Button variant="secondary" onClick={isComparing ? exitCompare : compare}>
                {isComparing ? 'Exit compare' : 'Compare'}
              </Button>
      </DevScope>
    )}
    {previewItem ? (
      <DevScope id="lwrh5qf">
        <Button variant="secondary" onClick={clearPreview}>Back to original</Button>
      </DevScope>
    ) : (
      <DevScope id="y2h3hbf">
        <Button variant="secondary" onClick={() => preview(OFF_LIST_VARIANT, { label: OFF_LIST_VARIANT.name, flippedLabel: item?.name })}>Preview variant</Button>
      </DevScope>
    )}
    {compareWith && (
      <DevScope id="qvemmy2">
        <Button
                variant="secondary"
                onClick={() => compareWith(OFF_LIST_VARIANT, { label: `A ${item?.name} / B ${OFF_LIST_VARIANT.name}` })}
              >
                Compare to variant
              </Button>
      </DevScope>
    )}
    <DevScope id="h2d9ydh">
      <Button variant="secondary" onClick={close}>Close</Button>
    </DevScope>
  </div>
)

const renderMediaLightboxOverlay = ({ isDetailsOpen, item, close }) => {
  if (isDetailsOpen) return null

  return (
    <DevScope id="j5m2dt8">
      <Button variant="secondary" size="sm" onClick={close}>
            Close {item?.name}
          </Button>
    </DevScope>
  )
}

const MediaLightboxDemo = () => {
  const [open, setOpen] = useState(false)
  const [defaultDetailsOpen, setDefaultDetailsOpen] = useState(true)

  const openLightbox = (detailsOpen) => {
    setDefaultDetailsOpen(detailsOpen)
    setOpen(true)
  }

  return (
    <>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <DevScope id="gm0kytf">
          <Button variant="primary" onClick={() => openLightbox(true)}>Open Media Lightbox</Button>
        </DevScope>
        <DevScope id="qa0s5xx">
          <Button variant="secondary" onClick={() => openLightbox(false)}>Open Collapsed Details</Button>
        </DevScope>
      </div>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Two-finger scroll horizontally over the lightbox to navigate. Press Compare to pin the current
        image as A and blink between it and B (hold the flip button or Space); arrows/wheel cycle B.
        Preview variant swaps the main stage to an off-list item until you navigate or hit Back to
        original; hold Space while previewing to peek back at the original. Compare to variant pins
        the current image as A against an off-list item as a fixed B.
      </p>
      {open && (
        <DevScope id="gemwtlg">
          <MediaLightbox
                    items={LIGHTBOX_ITEMS}
                    defaultDetailsOpen={defaultDetailsOpen}
                    getMedia={(item) => ({
                      src: item.src,
                      type: item.type,
                      extension: item.extension,
                      alt: item.name,
                    })}
                    getItemKey={(item) => item.id}
                    close={() => setOpen(false)}
                    renderOverlay={renderMediaLightboxOverlay}
                  >
                    <MediaLightboxActions />
                  </MediaLightbox>
        </DevScope>
      )}
    </>
  )
}

const SAMPLE_TAGS = {
  general: ['1girl', 'solo', 'long hair', 'looking at viewer', 'sitting'],
  character: ['george'],
  rating: ['safe'],
}

const LightboxSideTags = ({ size = 'small' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {Object.entries(SAMPLE_TAGS).map(([category, names]) => (
      <BadgeGroup key={category} label={category} size={size}>
        {names.map((name) => (
          <Badge key={name} autoColor>{name}</Badge>
        ))}
      </BadgeGroup>
    ))}
  </div>
)

const LightboxSideSlotsDemo = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DevScope id="uzuyrvr">
        <Button variant="primary" onClick={() => setOpen(true)}>Open Lightbox with Side Tags</Button>
      </DevScope>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        The left panel renders via <code>renderLeft</code> and is gated by the details toggle. Hide
        details and the tag panel disappears with it, keeping the image centered. The semicircle
        handle above the bottom bar independently collapses the lower panel; while collapsed the
        left tags render at the medium size.
      </p>
      {open && (
        <DevScope id="b55xypt">
          <MediaLightbox
                    items={LIGHTBOX_ITEMS}
                    getMedia={(item) => ({
                      src: item.src,
                      type: item.type,
                      extension: item.extension,
                      alt: item.name,
                    })}
                    getItemKey={(item) => item.id}
                    close={() => setOpen(false)}
                    renderLeft={(ml) => <LightboxSideTags size={ml.isBottomOpen ? 'small' : 'medium'} />}
                  >
                    <MediaLightboxActions />
                  </MediaLightbox>
        </DevScope>
      )}
    </>
  )
}

const MediaCompareDemo = () => (
  <div style={{ width: 480, height: 360, background: '#0a0a0a', borderRadius: '0.5rem' }}>
    <DevScope id="gbev4br">
      <MediaCompare
            base={LIGHTBOX_ITEMS[0]}
            overlay={LIGHTBOX_ITEMS[1]}
            getMedia={(item) => ({
              src: item.src,
              type: item.type,
              extension: item.extension,
              alt: item.name,
            })}
            actions={(
              <button type="button" onClick={() => alert('Make B a variant')}>Make B a variant</button>
            )}
          />
    </DevScope>
  </div>
)

const MediaPickerDemo = ({
  items = LIGHTBOX_ITEMS,
  loading = false,
  multiple = true,
  title = 'Browse media',
  emptyText,
  tileAction,
  tileCaption,
} = {}) => {
  const [open, setOpen] = useState(false)
  const [chosen, setChosen] = useState([])

  const handleConfirm = (picked) => {
    setChosen(picked)
    setOpen(false)
  }

  return (
    <>
      <DevScope id={{
        'Browse media': 'b3k58w0',
        'Loading media': 'a9k2p1x',
        'Empty picker': 'c7n4w8m',
        'Pick one': 'd2h6t3q',
      }[title] ?? 'b3k58w0'}>
        <Button variant="primary" onClick={() => setOpen(true)}>Open Media Picker</Button>
      </DevScope>
      {chosen.length > 0 && (
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Selected: {chosen.map((item) => item.name).join(', ')}
        </p>
      )}
      <DevScope id={{
        'Browse media': 'y5t9vut',
        'Loading media': 'p4s8k2n',
        'Empty picker': 'r6m1c9w',
        'Pick one': 't8v3b5h',
      }[title] ?? 'y5t9vut'}>
        <MediaPicker
                items={items}
                loading={loading}
                multiple={multiple}
                isOpen={open}
                close={() => setOpen(false)}
                confirm={handleConfirm}
                getMedia={(item) => ({
                  src: item.src,
                  type: item.type,
                  extension: item.extension,
                  alt: item.name,
                })}
                getItemKey={(item) => item.id}
                tileAction={tileAction}
                tileCaption={tileCaption}
                title={title}
                emptyText={emptyText}
              />
      </DevScope>
    </>
  )
}

const TypeaheadDemo = () => {
  const [selected, setSelected] = useState('springfield')

  return (
    <div style={{ maxWidth: '22rem' }}>
      <DevScope id="zarts2x">
        <Typeahead defaultValue={selected} options={LOCATION_OPTIONS} select={setSelected}>
                <TypeaheadInput placeholder="Filter towns..." />
                <TypeaheadList>
                  {LOCATION_OPTIONS.map((option) => (
                    <TypeaheadItem key={option.value} value={option.value}>
                      {option.displayValue}
                    </TypeaheadItem>
                  ))}
                </TypeaheadList>
                <TypeaheadEmpty>No matching towns</TypeaheadEmpty>
              </Typeahead>
      </DevScope>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Selected: {LOCATION_OPTIONS.find((option) => option.value === selected)?.displayValue}
      </p>
    </div>
  )
}

const TypeaheadDropdownDemo = () => {
  const [selected, setSelected] = useState('')

  return (
    <div style={{ maxWidth: '22rem' }}>
      <DevScope id="ytti11y">
        <Typeahead options={LOCATION_OPTIONS} select={setSelected} openOnFocus>
                <TypeaheadInput placeholder="Focus to browse towns..." />
                <TypeaheadList>
                  {LOCATION_OPTIONS.map((option) => (
                    <TypeaheadItem key={option.value} value={option.value}>
                      {option.displayValue}
                    </TypeaheadItem>
                  ))}
                </TypeaheadList>
                <TypeaheadEmpty>No matching towns</TypeaheadEmpty>
              </Typeahead>
      </DevScope>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Selected: {LOCATION_OPTIONS.find((option) => option.value === selected)?.displayValue || 'none'}
      </p>
    </div>
  )
}

const TypeaheadRichOptionDemo = () => {
  const [selected, setSelected] = useState('')

  const options = LOCATION_OPTIONS.map((option) => ({
    value: option.value,
    searchValue: option.displayValue,
    displayValue: (
      <span style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span>{option.displayValue}</span>
        <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>town</span>
      </span>
    ),
  }))

  return (
    <div style={{ maxWidth: '22rem' }}>
      <DevScope id="bvsqkw9">
        <Typeahead options={options} select={setSelected} openOnFocus>
                <TypeaheadInput placeholder="Focus to browse towns..." />
                <TypeaheadList />
                <TypeaheadEmpty>No matching towns</TypeaheadEmpty>
              </Typeahead>
      </DevScope>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Selected: {LOCATION_OPTIONS.find((option) => option.value === selected)?.displayValue || 'none'}
      </p>
    </div>
  )
}

const FilterableDropdownDemo = () => {
  const [selected, setSelected] = useState('capital-city')

  return (
    <div style={{ maxWidth: '22rem' }}>
      <DevScope id="vgx7zsm">
        <DropdownTypeahead defaultValue={selected} options={LOCATION_OPTIONS} change={setSelected} filter>
                <DropdownTypeaheadTrigger placeholder="Pick a town..." />
                <DropdownTypeaheadMenu filterPlaceholder="Search towns..." />
              </DropdownTypeahead>
      </DevScope>
    </div>
  )
}

const CreatableDropdownDemo = () => {
  const [options, setOptions] = useState(LOCATION_OPTIONS)
  const [selected, setSelected] = useState('')

  const handleCreate = (name) => {
    const value = name.toLowerCase().replace(/\s+/g, '-')
    setOptions((prev) => [...prev, { value, displayValue: name }])
    setSelected(value)
  }

  return (
    <div style={{ maxWidth: '22rem' }}>
      <DevScope id="vfyv5ij">
        <DropdownTypeahead defaultValue={selected} options={options} change={setSelected} create={handleCreate} filter>
                <DropdownTypeaheadTrigger placeholder="Pick or create a town..." />
                <DropdownTypeaheadMenu filterPlaceholder="Search or create..." createLabel={(value) => `Create town "${value}"`} />
              </DropdownTypeahead>
      </DevScope>
    </div>
  )
}

const NormalDropdownDemo = ({ placement }) => {
  const [picked, setPicked] = useState('none')
  const ids = {
    'bottom-right': { dropdown: 'gtqavzo', term: 'yz8w7rr', entity: 'tt9hs46', board: 'e5kmn1i' },
    'top-center': { dropdown: 'n64gmq8', term: 'k84f5j4', entity: 'e5fpf8w', board: 'gz87aif' },
  }[placement]

  return (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '4rem 0' }}>
      <DevScope id={ids.dropdown}>
        <Dropdown placement={placement}>
          <Button variant="secondary">Add to… ({placement})</Button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', minWidth: '10rem', background: '#1f2937', border: '1px solid #374151', borderRadius: '0.5rem' }}>
            <DevScope id={ids.term}>
              <Button variant="ghost" onClick={() => setPicked('Term')}>Term</Button>
            </DevScope>
            <DevScope id={ids.entity}>
              <Button variant="ghost" onClick={() => setPicked('Entity')}>Entity</Button>
            </DevScope>
            <DevScope id={ids.board}>
              <Button variant="ghost" onClick={() => setPicked('Asset Board')}>Asset Board</Button>
            </DevScope>
          </div>
        </Dropdown>
      </DevScope>
      <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Picked: {picked}</span>
    </div>
  )
}

const BadgeDemo = () => {
  const [tags, setTags] = useState(['landscape', 'portrait', 'sunset', 'anime'])

  const removeTag = (name) => setTags((prev) => prev.filter((tag) => tag !== name))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <DevScope id="tdn1gr1">
          <Badge variant="neutral">Neutral</Badge>
        </DevScope>
        <DevScope id="jfgxv6r">
          <Badge variant="primary">Primary</Badge>
        </DevScope>
        <DevScope id="vuw3e9l">
          <Badge variant="success">Success</Badge>
        </DevScope>
        <DevScope id="r0ga7p3">
          <Badge variant="warning">Warning</Badge>
        </DevScope>
        <DevScope id="slm19ey">
          <Badge variant="danger">Danger</Badge>
        </DevScope>
        <DevScope id="pwjyp11">
          <Badge variant="info">Info</Badge>
        </DevScope>
        <DevScope id="j0jwg0y">
          <Badge count={5} />
        </DevScope>
        <DevScope id="wwz08p8">
          <Badge count={150} max={99} />
        </DevScope>
        <DevScope id="lto9klv">
          <Badge dot />
        </DevScope>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        <DevScope id="vgkjcy1">
          <Badge size="small" variant="primary">Small</Badge>
        </DevScope>
        <DevScope id="zsodgaf">
          <Badge size="medium" variant="primary">Medium</Badge>
        </DevScope>
        <DevScope id="nscgox9">
          <Badge size="large" variant="primary">Large (default)</Badge>
        </DevScope>
        <DevScope id="zn37pnj">
          <Badge size="small" count={5} />
        </DevScope>
        <DevScope id="n9l9imk">
          <Badge size="medium" count={5} />
        </DevScope>
        <DevScope id="qtphmfi">
          <Badge size="large" count={5} />
        </DevScope>
        <DevScope id="gwfuvx1">
          <Badge size="small" dot />
        </DevScope>
        <DevScope id="es6dwya">
          <Badge size="medium" dot />
        </DevScope>
        <DevScope id="pdtprz7">
          <Badge size="large" dot />
        </DevScope>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
        {tags.map((tag) => (
          <Badge key={tag} autoColor remove={() => removeTag(tag)}>{tag}</Badge>
        ))}
        {tags.length === 0 && <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>All removed</span>}
      </div>
    </div>
  )
}

const MASONRY_HUES = [8, 32, 96, 168, 200, 232, 272, 312, 340, 20, 128, 256]

const MASONRY_ITEMS = Array.from({ length: 48 }, (_, index) => ({
  id: `tile-${index}`,
  ratio: 0.6 + ((index * 37) % 100) / 100,
  hue: MASONRY_HUES[index % MASONRY_HUES.length],
}))

const MasonryTile = ({ item, index }) => (
  <div
    style={{
      aspectRatio: item.ratio,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '0.5rem',
      background: `hsl(${item.hue} 45% 30%)`,
      color: '#f3f4f6',
      fontSize: '1.25rem',
    }}
  >
    {index}
  </div>
)

const MasonryDemo = () => (
  <div>
    <DevScope id="wquwhpf">
      <Masonry data={MASONRY_ITEMS} columnWidth={12} gap={0.75}>
            <MasonryTile />
          </Masonry>
    </DevScope>
    <p style={{ margin: '0.75rem 0 0', color: '#d1d5db', fontSize: '0.875rem' }}>
      Equal-width columns with variable-height tiles. The column count reflows from the container
      width and a rem-based target column width; virtualization and window scroll are preserved.
    </p>
  </div>
)

const GRID_HUES = [8, 32, 96, 168, 200, 232, 272, 312, 340, 20, 128, 256]

const buildGridItems = (count) => Array.from({ length: count }, (_, index) => ({
  id: `cell-${index}`,
  hue: GRID_HUES[index % GRID_HUES.length],
}))

const GRID_ITEMS = buildGridItems(12)
const VIRTUAL_GRID_ITEMS = buildGridItems(2000)

const GridCell = ({ item, index }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '6rem',
      borderRadius: '0.5rem',
      background: `hsl(${item.hue} 45% 30%)`,
      color: '#f3f4f6',
      fontSize: '1.25rem',
    }}
  >
    {index}
  </div>
)

const GridDemo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div>
      <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
        Responsive: <code>minItemWidth=&#123;10&#125;</code> fills the row with auto-fill tracks of at
        least 10rem.
      </p>
      <DevScope id="yppc7sj">
        <Grid data={GRID_ITEMS} minItemWidth={10} gap={0.75}>
                <GridCell />
              </Grid>
      </DevScope>
    </div>
    <div>
      <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
        Fixed: <code>columns=&#123;4&#125;</code> always renders four equal columns.
      </p>
      <DevScope id="a3dutuv">
        <Grid data={GRID_ITEMS} columns={4} gap={0.75}>
                <GridCell />
              </Grid>
      </DevScope>
    </div>
  </div>
)

const VirtualGridDemo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
    <div>
      <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
        2000 items in a contained scroller: same props as Grid plus{' '}
        <code>useWindowScroll=&#123;false&#125;</code> and <code>height</code>.
      </p>
      <DevScope id="sg6mpzr">
        <VirtualGrid
                data={VIRTUAL_GRID_ITEMS}
                minItemWidth={10}
                gap={0.75}
                useWindowScroll={false}
                height="24rem"
              >
                <GridCell />
              </VirtualGrid>
      </DevScope>
    </div>
    <div>
      <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
        Fixed column count, virtualized: <code>columns=&#123;5&#125;</code>.
      </p>
      <DevScope id="u1janib">
        <VirtualGrid
                data={VIRTUAL_GRID_ITEMS}
                columns={5}
                gap={0.75}
                useWindowScroll={false}
                height="24rem"
              >
                <GridCell />
              </VirtualGrid>
      </DevScope>
    </div>
  </div>
)

const SORTABLE_GRID_ITEMS = Array.from({ length: 8 }, (_, index) => ({
  id: `sort-${index}`,
  order: index + 1,
  hue: GRID_HUES[index % GRID_HUES.length],
}))

const handleGridReorder = (item, newOrder) => {
  // eslint-disable-next-line no-console
  console.log('grid reorder', { id: item.id, newOrder })
}

const SortableGridDemo = () => (
  <div>
    <p style={{ margin: '0 0 0.5rem', color: '#d1d5db', fontSize: '0.875rem' }}>
      Drag a cell onto another. <code>onReorder</code> receives the item and the drop target&apos;s{' '}
      <code>order</code>.
    </p>
    <DevScope id="hs0a0an">
      <Grid data={SORTABLE_GRID_ITEMS} minItemWidth={10} gap={0.75} onReorder={handleGridReorder}>
            <GridCell />
          </Grid>
    </DevScope>
  </div>
)

const VIRTUAL_LIST_ITEMS = Array.from({ length: 200 }, (_, index) => ({
  id: `row-${index}`,
  label: `Row ${index + 1}`,
}))

const VirtualListRow = ({ item, index }) => (
  <div
    style={{
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #374151',
      textAlign: 'left',
      color: '#d1d5db',
    }}
  >
    {index}: {item.label}
  </div>
)

const VirtualListDemo = () => (
  <DevScope id="epu40xv">
    <VirtualList data={VIRTUAL_LIST_ITEMS} useWindowScroll={false} height="24rem">
        <VirtualListRow />
      </VirtualList>
  </DevScope>
)

const MAP_ITEMS = Array.from({ length: 6 }, (_, index) => ({
  id: `map-${index}`,
  label: `Item ${index + 1}`,
  hue: GRID_HUES[index % GRID_HUES.length],
}))

const MapRow = ({ item, index }) => (
  <div
    style={{
      padding: '0.5rem 0.75rem',
      textAlign: 'left',
      color: '#d1d5db',
      borderBottom: '1px solid #374151',
    }}
  >
    {index}: {item.label}
  </div>
)

const PaginationMapDemo = () => {
  const [page, setPage] = useState(1)
  const pageSize = 4
  const start = (page - 1) * pageSize
  const slice = GRID_ITEMS.slice(start, start + pageSize)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <DevScope id="fqox5c5">
        <Map data={slice}>
                <GridCell />
              </Map>
      </DevScope>
      <DevScope id="ep8pblc">
        <Pagination totalItems={GRID_ITEMS.length} pageSize={pageSize} change={setPage} />
      </DevScope>
    </div>
  )
}

const SelectDemo = () => {
  const [selected, setSelected] = useState('springfield')

  return (
    <div style={{ maxWidth: '22rem', textAlign: 'left' }}>
      <DevScope id="o8060f7">
        <Select defaultValue={selected} options={LOCATION_OPTIONS} change={setSelected} />
      </DevScope>
      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Selected: {LOCATION_OPTIONS.find((option) => option.value === selected)?.displayValue}
      </p>
    </div>
  )
}

const DrawerDemo = ({ placement }) => (
  <DevScope id={{ left: 'fh2vpm5', right: 'u5l4s3q', top: 'gqhu7lp', bottom: 'fpmx6m5' }[placement]}>
    <Drawer placement={placement}>
      <div style={{ padding: '1rem', minWidth: '16rem' }}>
        <h2 style={{ marginTop: 0 }}>{placement} drawer</h2>
        <p>Slides in from the {placement}.</p>
      </div>
      <Button variant="secondary">Open {placement}</Button>
    </Drawer>
  </DevScope>
)

const LocalBrowserOverlayDemo = () => {
  const [open, setOpen] = useState(false)

  return (
    <>
      <DevScope id="j1vuzmv">
        <Button variant="primary" onClick={() => setOpen((prev) => !prev)}>
                {open ? 'Close overlay' : 'Open overlay'}
              </Button>
      </DevScope>
      {open && <DevScope id="ebnj0fq"><LocalBrowserOverlay apiBase={LFT_API_BASE} /></DevScope>}
    </>
  )
}

const DevInspectorDemo = () => {
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState('item-a')

  return (
    <DevScope id="a8k2n4p">
      <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'left' }}>
        Hold Alt and hover. Latch Dev from the panel. Copy writes <code>##</code> plus the leaf id.
      </p>
      <DevScope id="b3m7q1w" state={{ open, selectedId }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <DevScope id="follywe">
            <Button variant="secondary" onClick={() => setOpen((prev) => !prev)}>
              {open ? 'Mark closed' : 'Mark open'}
            </Button>
          </DevScope>
          <DevScope id="k04ypmt">
            <Button
              variant="secondary"
              onClick={() => setSelectedId(selectedId === 'item-a' ? 'item-b' : 'item-a')}
            >
              Selected: {selectedId}
            </Button>
          </DevScope>
          <DevScope id="lbaeq0h">
            <Popup>
              <div>
                <h2 style={{ marginTop: 0 }}>Portal popup</h2>
                <p>This popup is in a portal; Alt-hover still shows the scope chain.</p>
              </div>
              <Button variant="primary">Open Popup</Button>
            </Popup>
          </DevScope>
          <DevScope id="drmgh55">
            <Drawer placement="right">
              <div style={{ padding: '1rem', minWidth: '16rem' }}>
                <h2 style={{ marginTop: 0 }}>Portal drawer</h2>
                <p>Drawer content is portalled; inspect it with Alt held.</p>
              </div>
              <Button variant="secondary">Open Drawer</Button>
            </Drawer>
          </DevScope>
        </div>
      </DevScope>
    </DevScope>
  )
}

const MediaMagnifierStandaloneDemo = () => {
  const src = new URL('./assets/george.webp', import.meta.url).href

  return (
    <div style={{ width: 400, height: 400, position: 'relative' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      <DevScope id="b8frab9">
        <MediaMagnifier src={src} />
      </DevScope>
    </div>
  )
}

const UPLOAD_FILE_ROW_STATES = [
  {
    id: 'uploading',
    file: { name: 'george.webp', size: 204800 },
    status: 'uploading',
    progress: 42,
  },
  {
    id: 'done',
    file: { name: 'done.webp', size: 102400 },
    status: 'done',
    progress: 100,
  },
  {
    id: 'failed',
    file: { name: 'failed.webp', size: 51200 },
    status: 'failed',
    error: 'Network error',
  },
]

const App = () => (
  <div className="app">
    <h1>Component Library</h1>

    <Section title="DevInspector">
      <DevScope id="ga7ckpb">
        <Fold>
          <FoldTrigger>Nested Scopes And Portals</FoldTrigger>
          <FoldContent>
            <DevScope id="d7prqse">
              <DevInspectorDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Toast">
      <DevScope id="bjxphv3">
        <Fold >
          <FoldTrigger>Notifications</FoldTrigger>
          <FoldContent>
            <DevScope id="v2t3zzh">
              <Toast>
                <ToastDemo />
              </Toast>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Button">
      <DevScope id="wwrzqwo">
        <Fold >
          <FoldTrigger>Button Variants</FoldTrigger>
          <FoldContent>
            <DevScope id="iouwqx7">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <DevScope id="ssxnkm7">
                  <Button variant="primary">Primary</Button>
                </DevScope>
                <DevScope id="xraukx0">
                  <Button variant="secondary">Secondary</Button>
                </DevScope>
                <DevScope id="c0jov0g">
                  <Button variant="danger">Danger</Button>
                </DevScope>
                <DevScope id="jnra4am">
                  <Button variant="ghost">Ghost</Button>
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="gwuot60">
        <Fold>
          <FoldTrigger>Button Sizes</FoldTrigger>
          <FoldContent>
            <DevScope id="ek9rkae">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <DevScope id="ahhvzr2">
                  <Button variant="primary" size="sm">Small</Button>
                </DevScope>
                <DevScope id="xueqyt4">
                  <Button variant="primary">Normal</Button>
                </DevScope>
                <DevScope id="wjctqt2">
                  <Button variant="primary" size="lg">Large</Button>
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="h305f3x">
        <Fold>
          <FoldTrigger>Button States</FoldTrigger>
          <FoldContent>
            <DevScope id="dvbfrny">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
                <DevScope id="oj1s08f">
                  <Button variant="primary" disabled>Disabled</Button>
                </DevScope>
                <ButtonLoadingDemo />
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Tabs">
      <DevScope id="ou2ze5b">
        <Fold >
          <FoldTrigger>Simpson Family Tabs</FoldTrigger>
          <FoldContent>
            <DevScope id="m2ghxlg">
              <Tabs count={4}>
                <TabList>
                  <Tab>Homer</Tab>
                  <Tab>Marge</Tab>
                  <Tab>Bart</Tab>
                  <Tab>Lisa</Tab>
                </TabList>
                <TabPanel panelIndex={0}>
                  <strong>Homer Simpson</strong>
                  <p>Safety inspector at the Springfield Nuclear Power Plant. Loves donuts, beer, and watching TV. Catchphrase: &ldquo;D&rsquo;oh!&rdquo;</p>
                </TabPanel>
                <TabPanel panelIndex={1}>
                  <strong>Marge Simpson</strong>
                  <p>Homemaker and the moral backbone of the family. Known for her tall blue hair and infinite patience with Homer.</p>
                </TabPanel>
                <TabPanel panelIndex={2}>
                  <strong>Bart Simpson</strong>
                  <p>Troublemaker and underachiever — and proud of it. Catchphrase: &ldquo;Eat my shorts!&rdquo; Favourite hobby: pranking.</p>
                </TabPanel>
                <TabPanel panelIndex={3}>
                  <strong>Lisa Simpson</strong>
                  <p>Gifted student, jazz musician, and activist. The intellectual heart of the Simpson household.</p>
                </TabPanel>
              </Tabs>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="gi8lbs7">
        <Fold>
          <FoldTrigger>Tabs with Default Index</FoldTrigger>
          <FoldContent>
            <DevScope id="x56mr2n">
              <Tabs defaultIndex={1} count={3}>
                <TabList>
                  <Tab>Tab One</Tab>
                  <Tab>Tab Two (Default)</Tab>
                  <Tab>Tab Three</Tab>
                </TabList>
                <TabPanel panelIndex={0}>
                  <p>Content for Tab One.</p>
                </TabPanel>
                <TabPanel panelIndex={1}>
                  <p>This tab starts as the active tab because <code>defaultIndex=&#123;1&#125;</code> was passed to the Tabs HOC.</p>
                </TabPanel>
                <TabPanel panelIndex={2}>
                  <p>Content for Tab Three.</p>
                </TabPanel>
              </Tabs>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="pjghzde">
        <Fold>
          <FoldTrigger>Loop</FoldTrigger>
          <FoldContent>
            <DevScope id="ps6qghf">
              <Tabs loop count={3}>
                <TabList>
                  <Tab>One</Tab>
                  <Tab>Two</Tab>
                  <Tab>Three</Tab>
                </TabList>
                <TabPanel panelIndex={0}>
                  <p><code>loop</code> wraps next/back from withViewSwitch around the ends.</p>
                </TabPanel>
                <TabPanel panelIndex={1}>
                  <p>Tab Two.</p>
                </TabPanel>
                <TabPanel panelIndex={2}>
                  <p>Tab Three.</p>
                </TabPanel>
              </Tabs>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Canvas">
      <DevScope id="o9sz6ol">
        <Fold>
          <FoldTrigger>Camera, Minimap And Controls</FoldTrigger>
          <FoldContent>
            <DevScope id="irhbk0h">
              <CanvasDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Masonry">
      <DevScope id="r6wfptt">
        <Fold>
          <FoldTrigger>Pinterest-style Columns</FoldTrigger>
          <FoldContent>
            <DevScope id="v7f14k8">
              <MasonryDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Grid">
      <DevScope id="fuy4v2e">
        <Fold>
          <FoldTrigger>Responsive And Fixed Columns</FoldTrigger>
          <FoldContent>
            <DevScope id="m3t5310">
              <GridDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="yr4jh5y">
        <Fold>
          <FoldTrigger>Sortable</FoldTrigger>
          <FoldContent>
            <DevScope id="tgq4zp2">
              <SortableGridDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="VirtualGrid">
      <DevScope id="maqfsec">
        <Fold>
          <FoldTrigger>Virtualized Grid Of 2000 Items</FoldTrigger>
          <FoldContent>
            <DevScope id="t5ej5r2">
              <VirtualGridDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="VirtualList">
      <DevScope id="odqk545">
        <Fold>
          <FoldTrigger>Contained List Of 200 Items</FoldTrigger>
          <FoldContent>
            <DevScope id="az1bwx4">
              <VirtualListDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Map">
      <DevScope id="b6d4f3o">
        <Fold>
          <FoldTrigger>Data Template</FoldTrigger>
          <FoldContent>
            <DevScope id="iwt7mc9">
              <Map data={MAP_ITEMS}>
                <MapRow />
              </Map>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Pagination">
      <DevScope id="y2qfadv">
        <Fold>
          <FoldTrigger>Ellipsis Window</FoldTrigger>
          <FoldContent>
            <DevScope id="pqgygcm">
              <Pagination totalItems={95} pageSize={10} />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="yy1wdt2">
        <Fold>
          <FoldTrigger>Sliced Map</FoldTrigger>
          <FoldContent>
            <DevScope id="jba6s7w">
              <PaginationMapDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Timeline">
      <DevScope id="j9b1yaw">
        <Fold>
          <FoldTrigger>Horizontal Track</FoldTrigger>
          <FoldContent>
            <DevScope id="ihcjmao">
              <TimelineDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="TimelineGraph">
      <DevScope id="ty7ajqp">
        <Fold>
          <FoldTrigger>Forks and Merges</FoldTrigger>
          <FoldContent>
            <DevScope id="i6qlpnv">
              <TimelineGraphDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="ColorPicker">
      <DevScope id="p6vupu5">
        <Fold>
          <FoldTrigger>HSV Picker With Palette</FoldTrigger>
          <FoldContent>
            <DevScope id="jxc9k6m">
              <ColorPickerDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Typeahead">
      <DevScope id="kawovdl">
        <Fold>
          <FoldTrigger>Filter Towns</FoldTrigger>
          <FoldContent>
            <DevScope id="l5ypy89">
              <TypeaheadDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
      <DevScope id="u6gzviv">
        <Fold>
          <FoldTrigger>Open On Focus (Dropdown)</FoldTrigger>
          <FoldContent>
            <DevScope id="yu5cp14">
              <TypeaheadDropdownDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
      <DevScope id="duv394h">
        <Fold>
          <FoldTrigger>Rich Options (searchValue)</FoldTrigger>
          <FoldContent>
            <DevScope id="yvfqgim">
              <TypeaheadRichOptionDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Dropdown">
      <DevScope id="magj3km">
        <Fold>
          <FoldTrigger>Click Dropdown (bottom-right)</FoldTrigger>
          <FoldContent>
            <DevScope id="bjnq52i">
              <NormalDropdownDemo placement="bottom-right" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="s89uxzo">
        <Fold>
          <FoldTrigger>Click Dropdown (top-center)</FoldTrigger>
          <FoldContent>
            <DevScope id="rydgqx8">
              <NormalDropdownDemo placement="top-center" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Dropdown Typeahead">
      <DevScope id="r7h73kv">
        <Fold>
          <FoldTrigger>Filterable Dropdown Typeahead</FoldTrigger>
          <FoldContent>
            <DevScope id="n0i2ofj">
              <FilterableDropdownDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="o0brvir">
        <Fold>
          <FoldTrigger>Creatable Dropdown Typeahead</FoldTrigger>
          <FoldContent>
            <DevScope id="zljbow9">
              <CreatableDropdownDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Select">
      <DevScope id="lld3nge">
        <Fold>
          <FoldTrigger>Native Select</FoldTrigger>
          <FoldContent>
            <DevScope id="wc03r4u">
              <SelectDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Form">
      <DevScope id="uqne28k">
        <Fold>
          <FoldTrigger>Contact Form</FoldTrigger>
          <FoldContent>
            <DevScope id="cxd8ge1">
              <Form config={contactConfig} submit={handleSubmit}>
                <FormField name="name">
                  <FormLabel>Full Name</FormLabel>
                  <FormInput type="text" placeholder="Homer Simpson" />
                  <FormError />
                </FormField>

                <FormField name="email">
                  <FormLabel>Email</FormLabel>
                  <FormInput type="email" placeholder="homer@springfield.gov" />
                  <FormError />
                </FormField>

                <FormField name="age">
                  <FormLabel>Age</FormLabel>
                  <FormInput type="number" placeholder="39" />
                  <FormError />
                </FormField>

                <FormField name="role">
                  <FormLabel>Role</FormLabel>
                  <FormSelect placeholder="Select a role…" />
                  <FormError />
                </FormField>

                <FormField name="bio">
                  <FormLabel>Bio</FormLabel>
                  <FormTextarea placeholder="Tell us about yourself…" />
                  <FormError />
                </FormField>

                <FormSubmit>Submit</FormSubmit>
              </Form>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="hukdx0o">
        <Fold>
          <FoldTrigger>Filterable Form Dropdown</FoldTrigger>
          <FoldContent>
            <DevScope id="ddkeatc">
              <Form config={filterableDropdownFormConfig} submit={handleSubmit}>
                <FormField name="location">
                  <FormLabel>Location</FormLabel>
                  <FormDropdown placeholder="Pick a location..." filter />
                  <FormError />
                </FormField>

                <FormSubmit>Submit Location</FormSubmit>
              </Form>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="nkxj6l4">
        <Fold >
          <FoldTrigger>Extended Form (All New Field Types)</FoldTrigger>
          <FoldContent>
            <DevScope id="eyja235">
              <Form config={extendedFormConfig} submit={handleExtendedSubmit}>
                <FormField name="fullName">
                  <FormLabel>Full Name</FormLabel>
                  <FormInput type="text" placeholder="Homer Simpson" />
                  <FormError />
                </FormField>

                <FormField name="email">
                  <FormLabel>Email</FormLabel>
                  <FormInput type="email" placeholder="homer@springfield.gov" />
                  <FormError />
                </FormField>

                <FormField name="age">
                  <FormLabel>Age</FormLabel>
                  <FormInput type="number" placeholder="39" />
                  <FormError />
                </FormField>

                <FormField name="notifications">
                  <FormLabel>Enable Notifications</FormLabel>
                  <FormToggle />
                  <FormError />
                </FormField>

                <FormField name="phone">
                  <FormLabel>Phone Number</FormLabel>
                  <FormPhone />
                  <FormError />
                </FormField>

                <FormField name="department">
                  <FormLabel>Department</FormLabel>
                  <FormRadioGroup />
                  <FormError />
                </FormField>

                <FormField name="perks">
                  <FormLabel>Employee Perks</FormLabel>
                  <FormCheckboxGroup />
                  <FormError />
                </FormField>

                <FormField name="satisfaction">
                  <FormLabel>Job Satisfaction</FormLabel>
                  <FormRange min={0} max={100} step={5} />
                  <FormError />
                </FormField>

                <FormField name="startDate">
                  <FormLabel>Start Date</FormLabel>
                  <FormDate />
                  <FormError />
                </FormField>

                <FormField name="resume">
                  <FormLabel>Upload Resume</FormLabel>
                  <FormFile accept=".pdf,.doc,.docx" />
                  <FormError />
                </FormField>

                <FormField name="badgeColor">
                  <FormLabel>Badge Colour</FormLabel>
                  <FormColorPicker />
                  <FormError />
                </FormField>

                <FormField name="password">
                  <FormLabel>Password</FormLabel>
                  <FormPassword />
                  <FormError />
                </FormField>

                <FormField name="search">
                  <FormLabel>Search (with debounce)</FormLabel>
                  <FormSearch debounce={300} search={(v) => console.log('Search:', v)} />
                  <FormError />
                </FormField>

                <FormField name="floor">
                  <FormLabel>Office Floor</FormLabel>
                  <FormDropdown placeholder="Pick a floor…" filter />
                  <FormError />
                </FormField>

                <FormSubmit>Submit Extended Form</FormSubmit>
              </Form>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="p33k1e1">
        <Fold>
          <FoldTrigger>Generic Form (auto-mapped from config)</FoldTrigger>
          <FoldContent>
            <DevScope id="w7bsfrp">
              <GenericForm
                config={extendedFormConfig}
                submit={handleExtendedSubmit}
                title="Employee Onboarding"
                submitLabel="Submit Onboarding"
              />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Card">
      <DevScope id="i2pb2vz">
        <Fold>
          <FoldTrigger>Home Address</FoldTrigger>
          <FoldContent>
            <DevScope id="j6a9paw">
              <Card>
                <DevScope id="raiuf8t">
                  <CardHeader>Home Address</CardHeader>
                </DevScope>
                <DevScope id="vs0bdh7">
                  <CardSection>
                    <CardLabel>Street</CardLabel>
                    742 Evergreen Terrace
                  </CardSection>
                </DevScope>
                <DevScope id="m2cjakm">
                  <CardRow>
                    <DevScope id="hukzdyc">
                      <CardSection size={2}>
                        <CardLabel>City</CardLabel>
                        Springfield
                      </CardSection>
                    </DevScope>
                    <DevScope id="b7zwbj0">
                      <CardSection>
                        <CardLabel>State</CardLabel>
                        Illinois
                      </CardSection>
                    </DevScope>
                    <DevScope id="m0dn09v">
                      <CardSection>
                        <CardLabel>ZIP</CardLabel>
                        62701
                      </CardSection>
                    </DevScope>
                  </CardRow>
                </DevScope>
              </Card>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Row">
      <DevScope id="ukca32b">
        <Fold>
          <FoldTrigger>Name</FoldTrigger>
          <FoldContent>
            <DevScope id="dhzy2sw">
              <Row>
                <DevScope id="l1bwmfn">
                  <RowHeader>Name</RowHeader>
                </DevScope>
                <DevScope id="nqhymw2">
                  <RowSection>
                                    <RowLabel>First</RowLabel>
                                    Homer
                                  </RowSection>
                </DevScope>
                <DevScope id="yn0cwhz">
                  <RowSection>
                                    <RowLabel>Middle</RowLabel>
                                    Jay
                                  </RowSection>
                </DevScope>
                <DevScope id="c3fcjjk">
                  <RowSection>
                                    <RowLabel>Last</RowLabel>
                                    Simpson
                                  </RowSection>
                </DevScope>
              </Row>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Media">
      <DevScope id="k23qy32">
        <Fold >
          <FoldTrigger>Image Media</FoldTrigger>
          <FoldContent>
            <DevScope id="xvbqist">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: 300, height: 300 }}>
                  <DevScope id="xown1fl">
                    <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" />
                  </DevScope>
                </div>
                <div style={{ width: 300, height: 300 }}>
                  <DevScope id="lsgjclh">
                    <Media src={new URL('./assets/george-wave.mp4', import.meta.url).href} type="video" />
                  </DevScope>
                </div>
                <div style={{ width: 300, height: 300 }}>
                  <DevScope id="e3lgmbf">
                    <Media
                                        src={new URL('./assets/george-wave.mp4', import.meta.url).href}
                                        poster={new URL('./assets/george.webp', import.meta.url).href}
                                        type="video"
                                      />
                  </DevScope>
                </div>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="m6hku24">
        <Fold>
          <FoldTrigger>Order</FoldTrigger>
          <FoldContent>
            <DevScope id="g72be2v">
              <OrderingContainer initialItems={ORDER_ITEMS} networkOrderChange={handleReorder}>
                {ORDER_ITEMS.map((item) => (
                  <OrderItem key={item.id} id={item.id} label={item.label} />
                ))}
              </OrderingContainer>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="k37fnok">
        <Fold>
          <FoldTrigger>Image Inspect</FoldTrigger>
          <FoldContent>
            <DevScope id="sy1q0mb">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <DevScope id="qb6n44w">
                  <Popup>
                    <div style={{ width: '80vw', height: '80vh' }}>
                      <DevScope id="e8on68r">
                        <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" variant="full" />
                      </DevScope>
                    </div>
                    <div style={{ width: 150, height: 150, cursor: 'pointer' }}>
                      <DevScope id="mndrbyd">
                        <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" />
                      </DevScope>
                    </div>
                  </Popup>
                </DevScope>
                <DevScope id="g3naaov">
                  <Popup>
                    <div style={{ width: '80vw', height: '80vh' }}>
                      <DevScope id="dxzszeo">
                        <Media src={new URL('./assets/george-wave.mp4', import.meta.url).href} type="video" variant="full" />
                      </DevScope>
                    </div>
                    <div style={{ width: 150, height: 150, cursor: 'pointer' }}>
                      <DevScope id="c5d6v8k">
                        <Media src={new URL('./assets/george-wave.mp4', import.meta.url).href} type="video" />
                      </DevScope>
                    </div>
                  </Popup>
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="y96zgzv">
        <Fold>
          <FoldTrigger>Media Magnifier</FoldTrigger>
          <FoldContent>
            <DevScope id="m4py7ho">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: 400, height: 400 }}>
                  <DevScope id="p9fgud3">
                    <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" variant="full" />
                  </DevScope>
                </div>
                <div style={{ width: 400, height: 400 }}>
                  <DevScope id="h84n26i">
                    <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" variant="full" magnify={false} />
                  </DevScope>
                </div>
                <div style={{ width: 400, height: 400 }}>
                  <DevScope id="ptshet5">
                    <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" variant="full" magnify={{ position: { left: 64, top: 64 } }} />
                  </DevScope>
                </div>
                <div style={{ width: 400, height: 400 }}>
                  <DevScope id="v5l0n1b">
                    <Media src={new URL('./assets/george.webp', import.meta.url).href} type="image" variant="full" magnify={{ circle: true }} />
                  </DevScope>
                </div>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="k2qlr0h">
        <Fold>
          <FoldTrigger>Standalone Media Magnifier</FoldTrigger>
          <FoldContent>
            <DevScope id="hmqepf3">
              <MediaMagnifierStandaloneDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="jorkqsj">
        <Fold>
          <FoldTrigger>Empty Placeholder</FoldTrigger>
          <FoldContent>
            <DevScope id="v9dbms1">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ width: 150, height: 150 }}>
                  <DevScope id="m16ozlx">
                    <Media type="image" />
                  </DevScope>
                </div>
                <div style={{ width: 150, height: 150 }}>
                  <DevScope id="o1jzpii">
                    <Media type="video" />
                  </DevScope>
                </div>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="o6pj47h">
        <Fold>
          <FoldTrigger>Media Lightbox</FoldTrigger>
          <FoldContent>
            <DevScope id="ooeelx3">
              <MediaLightboxDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="upnz1os">
        <Fold>
          <FoldTrigger>Media Lightbox Side Slots</FoldTrigger>
          <FoldContent>
            <DevScope id="wmygx4n">
              <LightboxSideSlotsDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="n4z4ouy">
        <Fold>
          <FoldTrigger>Media Compare</FoldTrigger>
          <FoldContent>
            <DevScope id="ywv58td">
              <MediaCompareDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="lvyvvgi">
        <Fold>
          <FoldTrigger>Media Picker</FoldTrigger>
          <FoldContent>
            <DevScope id="f3ir4t8">
              <MediaPickerDemo
                tileAction={(item) => (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      alert(`Secondary action on ${item.name}`)
                    }}
                  >
                    Action
                  </button>
                )}
                tileCaption={(item) => <span>{item.type}</span>}
              />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="pooel7t">
        <Fold>
          <FoldTrigger>Media Picker Loading</FoldTrigger>
          <FoldContent>
            <DevScope id="bjd7bt5">
              <MediaPickerDemo loading title="Loading media" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="inp5q5l">
        <Fold>
          <FoldTrigger>Media Picker Empty</FoldTrigger>
          <FoldContent>
            <DevScope id="lsxlibn">
              <MediaPickerDemo items={[]} emptyText="No media available" title="Empty picker" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="h5xk7n9">
        <Fold>
          <FoldTrigger>Media Picker Single</FoldTrigger>
          <FoldContent>
            <DevScope id="qeiotz4">
              <MediaPickerDemo multiple={false} title="Pick one" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="LocalBrowser">
      <DevScope id="rvhcqdo">
        <Fold>
          <FoldTrigger>Contained Browser</FoldTrigger>
          <FoldContent>
            <DevScope id="twlwp9w">
              <div style={{ height: '28rem', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                <DevScope id="znh0gsh">
                  <LocalBrowser apiBase={LFT_API_BASE} devId="f5p3w8c" />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="bwzv7su">
        <Fold>
          <FoldTrigger>Overlay</FoldTrigger>
          <FoldContent>
            <DevScope id="k71hact">
              <LocalBrowserOverlayDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Popup">
      <DevScope id="kx09ya4">
        <Fold>
          <FoldTrigger>Basic Popup</FoldTrigger>
          <FoldContent>
            <DevScope id="iktmmh6">
              <Popup>
                <div>
                  <h2 style={{ marginTop: 0 }}>Hello from the Popup!</h2>
                  <p>This is the inner popup content. Close it with the × button or by clicking the backdrop.</p>
                </div>
                <button>Open Popup</button>
              </Popup>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="xo0ek1i">
        <Fold>
          <FoldTrigger>No Close Button</FoldTrigger>
          <FoldContent>
            <DevScope id="xoys2hy">
              <Popup showClose={false}>
                <div>
                  <h2 style={{ marginTop: 0 }}>No close button</h2>
                  <p>Close via the backdrop or Escape.</p>
                </div>
                <Button variant="secondary">Open Popup</Button>
              </Popup>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="ddfcy81">
        <Fold>
          <FoldTrigger>Content Only</FoldTrigger>
          <FoldContent>
            <DevScope id="yh2e8pd">
              <Popup contentOnly>
                <div style={{ background: '#1f2937', padding: '1.5rem', borderRadius: '0.5rem' }}>
                  <h2 style={{ marginTop: 0 }}>Content only</h2>
                  <p><code>contentOnly</code> skips the panel chrome.</p>
                </div>
                <Button variant="secondary">Open Content-Only Popup</Button>
              </Popup>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="ljm8wfi">
        <Fold>
          <FoldTrigger>Tooltip</FoldTrigger>
          <FoldContent>
            <DevScope id="s8n88ym">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'center', padding: '4rem 0' }}>
                {TOOLTIP_PLACEMENTS.map((placement) => (
                  <DevScope key={placement} id={TOOLTIP_SCOPE_IDS[placement]}>
                    <Tooltip placement={placement}>
                      <Button variant="secondary">{placement}</Button>
                      <span>{placement}</span>
                    </Tooltip>
                  </DevScope>
                ))}
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="bw7q76d">
        <Fold>
          <FoldTrigger>Tooltip Click</FoldTrigger>
          <FoldContent>
            <DevScope id="rfix4hf">
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', padding: '2rem 0' }}>
                <DevScope id="wm1q6yg">
                  <Tooltip trigger="click" placement="bottom-center">
                                    <Button variant="secondary">Click me</Button>
                                    <span>Click tooltip</span>
                                  </Tooltip>
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Drawer">
      <DevScope id="o6bja24">
        <Fold>
          <FoldTrigger>Left</FoldTrigger>
          <FoldContent>
            <DevScope id="yf9oogi">
              <DrawerDemo placement="left" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="hjk6ypo">
        <Fold>
          <FoldTrigger>Right</FoldTrigger>
          <FoldContent>
            <DevScope id="p94uy6e">
              <DrawerDemo placement="right" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="w1v5dh8">
        <Fold>
          <FoldTrigger>Top</FoldTrigger>
          <FoldContent>
            <DevScope id="uxh6vrk">
              <DrawerDemo placement="top" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="fzsugrj">
        <Fold>
          <FoldTrigger>Bottom</FoldTrigger>
          <FoldContent>
            <DevScope id="o4gwc82">
              <DrawerDemo placement="bottom" />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="ViewSwitch">
      <DevScope id="qapq2jz">
        <Fold>
          <FoldTrigger>Simpson Family Members</FoldTrigger>
          <FoldContent>
            <DevScope id="kad8ymp">
              <ViewSwitch count={4}>
                <ViewSwitchControls />
                <ViewSwitchView viewIndex={0}>
                  <strong>Homer Simpson</strong>
                  <p>Safety inspector at the Springfield Nuclear Power Plant. Loves donuts, beer, and watching TV.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={1}>
                  <strong>Marge Simpson</strong>
                  <p>Homemaker and the moral backbone of the family. Known for her tall blue hair and patience.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={2}>
                  <strong>Bart Simpson</strong>
                  <p>Troublemaker and underachiever. Catchphrase: "Eat my shorts!" Favourite hobby: pranking.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={3}>
                  <strong>Lisa Simpson</strong>
                  <p>Gifted student, jazz musician, and activist. The intellectual heart of the Simpson household.</p>
                </ViewSwitchView>
              </ViewSwitch>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="je7yod5">
        <Fold>
          <FoldTrigger>Loop</FoldTrigger>
          <FoldContent>
            <DevScope id="rgw6kr1">
              <ViewSwitch count={4} loop>
                <ViewSwitchControls />
                <ViewSwitchView viewIndex={0}>
                  <strong>Homer Simpson</strong>
                  <p>Safety inspector at the Springfield Nuclear Power Plant. Loves donuts, beer, and watching TV.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={1}>
                  <strong>Marge Simpson</strong>
                  <p>Homemaker and the moral backbone of the family. Known for her tall blue hair and patience.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={2}>
                  <strong>Bart Simpson</strong>
                  <p>Troublemaker and underachiever. Catchphrase: "Eat my shorts!" Favourite hobby: pranking.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={3}>
                  <strong>Lisa Simpson</strong>
                  <p>Gifted student, jazz musician, and activist. The intellectual heart of the Simpson household.</p>
                </ViewSwitchView>
              </ViewSwitch>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="twklmhg">
        <Fold>
          <FoldTrigger>Default Index</FoldTrigger>
          <FoldContent>
            <DevScope id="ble1v4m">
              <ViewSwitch count={4} defaultIndex={2}>
                <ViewSwitchControls />
                <ViewSwitchView viewIndex={0}>
                  <strong>Homer Simpson</strong>
                  <p>Safety inspector at the Springfield Nuclear Power Plant. Loves donuts, beer, and watching TV.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={1}>
                  <strong>Marge Simpson</strong>
                  <p>Homemaker and the moral backbone of the family. Known for her tall blue hair and patience.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={2}>
                  <strong>Bart Simpson</strong>
                  <p>Starts on Bart because <code>defaultIndex=&#123;2&#125;</code>.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={3}>
                  <strong>Lisa Simpson</strong>
                  <p>Gifted student, jazz musician, and activist. The intellectual heart of the Simpson household.</p>
                </ViewSwitchView>
              </ViewSwitch>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="jxlpis1">
        <Fold>
          <FoldTrigger>Back And Next</FoldTrigger>
          <FoldContent>
            <DevScope id="r1j980t">
              <ViewSwitch count={4}>
                <ViewSwitchBack />
                <ViewSwitchNext />
                <ViewSwitchView viewIndex={0}>
                  <strong>Homer Simpson</strong>
                  <p>Safety inspector at the Springfield Nuclear Power Plant. Loves donuts, beer, and watching TV.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={1}>
                  <strong>Marge Simpson</strong>
                  <p>Homemaker and the moral backbone of the family. Known for her tall blue hair and patience.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={2}>
                  <strong>Bart Simpson</strong>
                  <p>Troublemaker and underachiever. Catchphrase: "Eat my shorts!" Favourite hobby: pranking.</p>
                </ViewSwitchView>
                <ViewSwitchView viewIndex={3}>
                  <strong>Lisa Simpson</strong>
                  <p>Gifted student, jazz musician, and activist. The intellectual heart of the Simpson household.</p>
                </ViewSwitchView>
              </ViewSwitch>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="MultiSelect">
      <DevScope id="e4pbi7c">
        <Fold>
          <FoldTrigger>Pick your favourite Simpsons characters</FoldTrigger>
          <FoldContent>
            <DevScope id="wpsnkhq">
              <MultiSelect>
                <CheckboxDisplay id="homer" value={{ name: 'Homer Simpson' }} label="Homer Simpson" />
                <CheckboxDisplay id="marge" value={{ name: 'Marge Simpson' }} label="Marge Simpson" />
                <CheckboxDisplay id="bart" value={{ name: 'Bart Simpson' }} label="Bart Simpson" />
                <CheckboxDisplay id="lisa" value={{ name: 'Lisa Simpson' }} label="Lisa Simpson" />
                <CheckboxDisplay id="maggie" value={{ name: 'Maggie Simpson' }} label="Maggie Simpson" />
              </MultiSelect>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Checkbox">
      <DevScope id="zx1f4vk">
        <Fold>
          <FoldTrigger>Standalone Checkbox</FoldTrigger>
          <FoldContent>
            <DevScope id="h6dnjnz">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                <DevScope id="o33qcdb">
                  <Checkbox id="checkbox-default" label="Unchecked by default" />
                </DevScope>
                <DevScope id="djry0cz">
                  <Checkbox id="checkbox-checked" label="Checked by default" defaultChecked />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Badge">
      <DevScope id="ux9d3d5">
        <Fold>
          <FoldTrigger>Variants, counts, and removable auto-colored chips</FoldTrigger>
          <FoldContent>
            <DevScope id="ihooamt">
              <BadgeDemo />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="vvkpzx2">
        <Fold>
          <FoldTrigger>Badge Group (labelled, grouped badges)</FoldTrigger>
          <FoldContent>
            <DevScope id="br9povi">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <DevScope id="hlap7ph">
                  <BadgeGroup label="general" size="small">
                                    <Badge autoColor>1girl</Badge>
                                    <Badge autoColor>solo</Badge>
                                    <Badge autoColor>long hair</Badge>
                                    <Badge autoColor>looking at viewer</Badge>
                                  </BadgeGroup>
                </DevScope>
                <DevScope id="mchdzjq">
                  <BadgeGroup label="character" size="small">
                                    <Badge autoColor>george</Badge>
                                  </BadgeGroup>
                </DevScope>
                <DevScope id="kgf8hpa">
                  <BadgeGroup label="medium" size="medium">
                                    <Badge autoColor>1girl</Badge>
                                    <Badge autoColor>solo</Badge>
                                    <Badge autoColor>long hair</Badge>
                                  </BadgeGroup>
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="szxyejr">
        <Fold>
          <FoldTrigger>Overlay</FoldTrigger>
          <FoldContent>
            <DevScope id="hdrla90">
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <DevScope id="vzu46eo">
                  <Badge count={3} overlay={<DevScope id="xmtqe5b"><Button variant="secondary">Inbox</Button></DevScope>} />
                </DevScope>
                <DevScope id="wozxc8c">
                  <Badge dot variant="danger" overlay={<DevScope id="t7iz5zl"><Button variant="secondary">Alerts</Button></DevScope>} />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="ProgressBar">
      <DevScope id="vphgenz">
        <Fold>
          <FoldTrigger>Status</FoldTrigger>
          <FoldContent>
            <DevScope id="u6r52pd">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <DevScope id="wh3f5bj">
                  <ProgressBar value={45} status="uploading" label="Uploading" showValue />
                </DevScope>
                <DevScope id="w4a25a4">
                  <ProgressBar value={100} status="done" label="Done" showValue />
                </DevScope>
                <DevScope id="jtu33ek">
                  <ProgressBar value={30} status="failed" label="Failed" showValue />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="gue1wnc">
        <Fold>
          <FoldTrigger>Striped And Animated</FoldTrigger>
          <FoldContent>
            <DevScope id="pj3nqm6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <DevScope id="ca7xp5j">
                  <ProgressBar value={60} striped label="Striped" showValue />
                </DevScope>
                <DevScope id="p17lscs">
                  <ProgressBar value={70} animated label="Animated" showValue />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Skeleton">
      <DevScope id="xym190b">
        <Fold>
          <FoldTrigger>Shapes</FoldTrigger>
          <FoldContent>
            <DevScope id="sth5zb4">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                <DevScope id="ztxq0fw">
                  <Skeleton shape="text" />
                </DevScope>
                <DevScope id="ajb33so">
                  <Skeleton shape="row" />
                </DevScope>
                <DevScope id="jvjtboq">
                  <Skeleton shape="card" />
                </DevScope>
                <DevScope id="a0qpoas">
                  <Skeleton shape="media" />
                </DevScope>
                <DevScope id="l44s0o2">
                  <Skeleton shape="circle" />
                </DevScope>
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="sbajfg4">
        <Fold>
          <FoldTrigger>Count</FoldTrigger>
          <FoldContent>
            <DevScope id="ru1us8u">
              <Skeleton shape="text" count={4} />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="MultiFileUpload">
      <DevScope id="kl7038c">
        <Fold>
          <FoldTrigger>Basic Usage (mock upload)</FoldTrigger>
          <FoldContent>
            <DevScope id="reavepk">
              <MultiFileUpload
                accept="image/*,.pdf"
                requestUpload={mockRequestUpload}
                complete={mockComplete}
              />
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="dgyjbi5">
        <Fold>
          <FoldTrigger>Custom File Row</FoldTrigger>
          <FoldContent>
            <DevScope id="g2q25yy">
              <MultiFileUpload
                requestUpload={mockRequestUpload}
                complete={mockComplete}
                maxConcurrent={2}
              >
                <CustomFileRow />
              </MultiFileUpload>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="jt9tux3">
        <Fold>
          <FoldTrigger>Upload File Row States</FoldTrigger>
          <FoldContent>
            <DevScope id="azpesf6">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'left' }}>
                {UPLOAD_FILE_ROW_STATES.map((entry) => (
                  <UploadFileRow
                    key={entry.id}
                    file={entry}
                    remove={() => {}}
                    retry={entry.status === 'failed' ? () => {} : undefined}
                  />
                ))}
              </div>
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>

    <Section title="Fold">
      <DevScope id="t6pejty">
        <Fold>
          <FoldTrigger>What is a Fold component?</FoldTrigger>
          <FoldContent>
            <DevScope id="tn7403v">
              A Fold (also called an accordion or disclosure) is a collapsible
              section that shows or hides content when its trigger is activated.
              This implementation separates state management from display so both
              can be composed independently.
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>

      <DevScope id="k851r7l">
        <Fold defaultOpen>
          <FoldTrigger>This one starts open</FoldTrigger>
          <FoldContent>
            <DevScope id="ly4qyrx">
              Pass <code>defaultOpen</code> to the <code>Fold</code> HOC and the
              panel will be expanded on first render.
            </DevScope>
          </FoldContent>
        </Fold>
      </DevScope>
    </Section>
  </div>
)

export default App
