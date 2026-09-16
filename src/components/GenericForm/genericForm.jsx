import useFormController from './useFormController'
import { FormDisplay, FormField, FormLabel, FormInput, FormTextarea, FormSelect, FormError, FormSubmit } from '../Form/form'
import FormToggle from '../FormToggle/formToggle'
import FormPhone from '../FormPhone/formPhone'
import FormRadioGroup from '../FormRadioGroup/formRadioGroup'
import FormCheckboxGroup from '../FormCheckboxGroup/formCheckboxGroup'
import FormRange from '../FormRange/formRange'
import FormDate from '../FormDate/formDate'
import FormFile from '../FormFile/formFile'
import MultiFileUpload from '../MultiFileUpload/multiFileUpload'
import FormColorPicker from '../FormColorPicker/formColorPicker'
import FormPassword from '../FormPassword/formPassword'
import FormSearch from '../FormSearch/formSearch'
import FormDropdown from '../FormDropdown/formDropdown'
import Card, { CardHeader, CardSection } from '../Card/card'
import './styles.css'

/**
 * typeComponentMap — maps each field type string to the component that
 * renders it, plus any default props the component expects.
 *
 * Each entry:
 *   component  — the React component to render inside the FormField
 *   props(cfg) — optional function returning extra props derived from
 *                the field config (e.g. min/max/step for range)
 */
const typeComponentMap = {
  text:          { component: FormInput,         props: (cfg) => ({ type: 'text', placeholder: cfg.placeholder }) },
  email:         { component: FormInput,         props: (cfg) => ({ type: 'email', placeholder: cfg.placeholder }) },
  number:        { component: FormInput,         props: (cfg) => ({ type: 'number', placeholder: cfg.placeholder }) },
  textarea:      { component: FormTextarea,      props: (cfg) => ({ placeholder: cfg.placeholder }) },
  select:        { component: FormSelect,        props: (cfg) => ({ placeholder: cfg.placeholder }) },
  toggle:        { component: FormToggle,        props: () => ({}) },
  phone:         { component: FormPhone,         props: () => ({}) },
  radio:         { component: FormRadioGroup,    props: () => ({}) },
  checkboxGroup: { component: FormCheckboxGroup, props: () => ({}) },
  range:         { component: FormRange,         props: (cfg) => ({ min: cfg.min, max: cfg.max, step: cfg.step }) },
  date:          { component: FormDate,          props: () => ({}) },
  file:          { component: FormFile,          props: (cfg) => ({ accept: cfg.accept, multiple: cfg.multiple }) },
  multiFile:     { component: MultiFileUpload,   props: (cfg) => ({ accept: cfg.accept, maxConcurrent: cfg.maxConcurrent, maxFileSize: cfg.maxFileSize, requestUpload: cfg.requestUpload, complete: cfg.complete, fail: cfg.fail }) },
  color:         { component: FormColorPicker,   props: () => ({}) },
  password:      { component: FormPassword,      props: () => ({}) },
  search:        { component: FormSearch,        props: (cfg) => ({ debounce: cfg.debounce, search: cfg.search, placeholder: cfg.placeholder }) },
  dropdown:      { component: FormDropdown,      props: (cfg) => ({ placeholder: cfg.placeholder }) },
}

/**
 * humanise — converts a camelCase field name into a readable label.
 *
 *   "badgeColor"   → "Badge Color"
 *   "startDate"    → "Start Date"
 *   "notifications" → "Notifications"
 */
const humanise = (name) =>
  name
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())

/**
 * GenericFormDisplay — pure display controller.
 *
 * Iterates over config.fields, resolves each field type to a component
 * via typeComponentMap, and renders the whole form inside a Card.
 *
 * Props:
 *   form      {object}   — full form state + actions (injected by withForm HOC)
 *   config    {object}   — the same config object passed to <Form>
 *   title     {string}   — optional card header title
 *   submitLabel {string} — label for the submit button (default "Submit")
 *   cancelLabel {string} — label for the cancel/reset button (default "Cancel")
 *   cancel     {function} — optional callback fired after the form is reset;
 *                           if omitted the cancel button still resets the form
 *   children             — optional extra children rendered after the auto-generated fields
 */
export const GenericFormDisplay = ({
  form = {},
  config = {},
  title,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  cancel,
  children,
  component: Component,
  resultComponent: ResultComponent,
}) => {
  const fields = config.fields ?? {}

  return (
    <Card>
      {title && (
        <CardHeader>{title}</CardHeader>
      )}
      <CardSection>
        <FormDisplay form={form}>
          {Component ? <Component form={form} /> : Object.entries(fields)
            .filter(([, fieldConfig]) => typeComponentMap[fieldConfig.type ?? 'text'])
            .map(([name, fieldConfig]) => {
              const { component: Component, props: getProps } = typeComponentMap[fieldConfig.type ?? 'text']
              const extraProps = getProps ? getProps(fieldConfig) : {}
              // Strip undefined values so they don't override component defaults
              const cleanProps = Object.fromEntries(
                Object.entries(extraProps).filter(([, v]) => v !== undefined)
              )

              return (
                <FormField key={name} name={name}>
                  <FormLabel>{fieldConfig.label ?? humanise(name)}</FormLabel>
                  <Component {...cleanProps} />
                  <FormError />
                </FormField>
              )
            })}

          {children}
          <div className="generic-form__actions">
            <button
              type="button"
              className="generic-form__cancel"
              disabled={form.isSubmitting}
              onClick={() => { form.reset?.(); cancel?.() }}
            >
              {cancelLabel}
            </button>
            <FormSubmit form={form} disabled={form.isReady === false || form.isSubmitting}>{submitLabel}</FormSubmit>
          </div>
          {form.error && <p role="alert">{form.error}</p>}
          {form.hasResponse && (ResultComponent
            ? <ResultComponent response={form.response} form={form} />
            : <pre className="generic-form__response" role="status">{typeof form.response === 'string' ? form.response : JSON.stringify(form.response ?? null, null, 2)}</pre>)}
        </FormDisplay>
      </CardSection>
    </Card>
  )
}

/**
 * withGenericForm — state controller HOC.
 *
 * Shares the form manager through the readiness-aware form controller.
 */
const withGenericForm = (WrappedComponent) => ({ config = {}, submit, onSubmit, component, ...props }) => {
  const form = useFormController(config, onSubmit ?? submit, Boolean(component))
  return <WrappedComponent form={form} config={config} component={component} {...props} />
}

const GenericForm = withGenericForm(GenericFormDisplay)
export default GenericForm

