# Form config

`GenericForm` and `DevInspector forms={[...]}` share the same form definition:

```jsx
{
  id: 'request', title: 'Request', icon: <RequestIcon />,
  submitLabel: 'Send',
  config: {
    fields: {
      name: { type: 'text', defaultValue: '', required: true },
      prompt: { type: 'textarea', label: 'Prompt' },
      model: { type: 'dropdown', options: [{ value: 'a', displayValue: 'A' }] },
      enabled: { type: 'toggle', defaultValue: false },
    },
  },
  onSubmit: async values => api.request(values),
  // component: CustomFields,          // replaces generated fields; receives { form }
  // resultComponent: Result,          // receives { response, form }; default: JSON/text
}
```

IDs must be unique. Each inspector form gets its own toolbar icon; click again to return to inspection. Switching forms or collapsing resets the mounted form. Change its key/ID to replace its config.

Fields also support `label`, `placeholder`, `validate(value, fieldConfig)` (error string or null), and `format(value)`. Types use the existing Form fieldTypes; omitted type means `text`. Submission preserves false/empty values.

Custom fields use `form.values`, `setValue(name, value)`, `errors`, `touched`, `setTouched(name)`, `onChange(name, event)`, and `onBlur(name, event)`. Declare their values/validators in `config.fields`. Render fields, not a nested `<form>`.

Readiness: custom roots must call `useFormReady(form, 'component', loaded)`. Every async child calls `useFormReady(form, uniqueId, loaded)`. List deferred children in `config.ready: ['childId']` so submission also waits before they mount. For intentionally absent conditional children, their parent reports readiness for that ID. Cleanup marks a child unready. Mount completion alone does not imply data has loaded.

`form.submit()` and the button wait for all readiness gates and reject duplicate submissions. `isReady`, `isSubmitting`, `reset()`, `response`, `hasResponse`, and `error` are exposed; rejected API calls show an error and allow retry. No request is sent before submit.

## Component views

`<DevInspector forms={forms} views={[{ id: 'sessions', title: 'Sessions', icon: <ListIcon />, component: SessionExplorer, props: {} }]} />`

A view renders directly in the scrollable panel, without a form/controller or submit button. It receives `props` plus `inspector: { descriptor, close() }`. IDs must be unique across forms and views. Views mount when selected and unmount when switched/closed/collapsed; clean up streams and timers on unmount.
