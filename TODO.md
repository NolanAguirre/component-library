# Component Library — TODO

## New Components

### Button
- [x] Stateless display component — renders a `<button>` with BEM variants
- [x] Variants/modifiers: `button--primary`, `button--secondary`, `button--danger`, `button--ghost`
- [x] Size modifiers: `button--sm`, `button--lg`
- [x] Supports `disabled` and loading/spinner state
- [x] Spreads `...rest` onto the native `<button>` (onClick, type, etc.)

### Form UI Display Components
Standalone display components that integrate with the Form system via the
`field: { name, value, onChange, onBlur }` namespace (received from `FormField`
via `cloneElement`). Each also works standalone when given props directly.

- [x] **FormToggle** — styled on/off toggle switch (boolean), alternative to checkbox
- [x] **FormPhone** — phone number input with formatting/masking
- [x] **FormRadioGroup / FormRadio** — radio button group bound to a single field value
- [x] **FormCheckboxGroup** — group of checkboxes that produce an array value for a single field
- [x] **FormRange** — styled `<input type="range">` slider with min/max/step and value label
- [x] **FormDate** — styled date picker input (wraps native `<input type="date">` or custom)
- [x] **FormFile** — file upload input with drag-and-drop zone and preview
- [x] **FormColorPicker** — color swatch / input for selecting a colour value
- [x] **FormPassword** — password input with show/hide toggle
- [x] **FormSearch** — search input with clear button and optional debounce

### Tabs
- [x] `withTabs` HOC managing `activeIndex`
- [x] `TabsDisplay` — display controller, clones children with `tabs: { index, select }`
- [x] `TabList` — horizontal row of tab buttons
- [x] `Tab` — individual tab button; active state from `tabs.index`
- [x] `TabPanel` — content area; renders children only when active

### Toast / Notification
- [x] `withToast` HOC managing a queue of `{ id, message, type, duration }`
- [x] `ToastDisplay` — renders toast items in a fixed-position container
- [x] `ToastItem` — single toast message with auto-dismiss timer and close button
- [x] Types: `success`, `error`, `warning`, `info`
- [x] `toast: { add, remove, items }` namespace injected into children

### Tooltip
- [x] Two-child pattern (content + trigger), similar to Popup
- [x] Shows positioned floating element on hover/focus, not a full backdrop
- [x] `tooltip: { isOpen, show, hide }` namespace
- [x] Placement options: top, bottom, left, right

### Dropdown
- [x] `withDropdown` HOC managing open state and selected value
- [x] `DropdownTrigger` — the button/element that toggles the menu
- [x] `DropdownMenu` — positioned list container
- [x] `DropdownItem` — individual option; receives `dropdown: { select, selected }`
- [x] Keyboard navigation (arrow keys, Enter, Escape)

### Pagination
- [ ] `withPagination` HOC managing `{ page, pageSize, totalPages }`
- [ ] `PaginationDisplay` — page numbers, prev/next buttons, page-size selector
- [ ] `pagination: { page, next, back, goTo, totalPages }` namespace
- [ ] Pairs with Grid and Map for large datasets

### Tag / Chip
- [ ] Stateless display with optional dismiss action
- [ ] Integrates with MultiSelect via `multiSelect: { remove }`
- [ ] Props: `id`, `label`, `dismiss` (action prop)
- [ ] Modifier: `tag--dismissible`

### Skeleton / Loading
- [ ] Placeholder loading states that mimic component shapes
- [ ] Modifiers: `skeleton--card`, `skeleton--row`, `skeleton--media`, `skeleton--text`
- [ ] Animated shimmer effect
- [ ] Gives the library a complete data lifecycle: loading → display → interaction

### Drawer
- [ ] `withDrawer` HOC managing open/closed state
- [ ] Slides in from a screen edge (left, right, top, bottom)
- [ ] `drawer: { isOpen, open, close, position }` namespace
- [ ] Backdrop overlay like Popup but panel is edge-anchored

### Badge
- [ ] Stateless display — small count or status indicator
- [ ] Attaches to a child element (e.g. notification count on a button)
- [ ] Modifiers: `badge--dot`, `badge--count`

### ProgressBar
- [ ] Stateless display showing completion percentage
- [ ] Props: `value`, `max`, optional `label`
- [ ] Can be driven by ViewSwitch `index/count` for step progress
- [ ] Modifiers: `progress--striped`, `progress--animated`

## Field Types (formManager)
New entries for `fieldTypes.js` to support the new Form UI components:

- [x] `toggle` — validate (required boolean), format → boolean, onChange → e.target.checked
- [x] `phone` — validate (pattern), format (strip non-digits or E.164), onChange → masked value
- [x] `radio` — validate (required), format → string, onChange → e.target.value
- [x] `checkboxGroup` — validate (min/max selections), format → array, onChange → toggle item in array
- [x] `range` — validate (min/max), format → number, onChange → e.target.value
- [x] `file` — validate (accept, maxSize), format → File or FileList, onChange → e.target.files
- [x] `color` — validate (hex pattern), format → string, onChange → e.target.value
- [x] `password` — validate (minLength, pattern for strength), format → string, onChange → e.target.value
- [x] `search` — validate (minLength), format → trimmed string, onChange → e.target.value



Easy to use virtaulizated dom layer that doesnt make it a pain in the ass to remove items from the dom.