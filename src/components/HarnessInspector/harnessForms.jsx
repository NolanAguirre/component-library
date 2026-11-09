import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { DevScope } from '../DevInspector/devInspector'
import PromptInput from '../PromptInput/promptInput'
import { useFormReady } from '../GenericForm/useFormController'

// `workspace` is { name, cwdPatterns, label }: match by name, then by cwd, then by preferredId.
export const preferredWorkspace = (workspaces, { name, cwdPatterns = [] } = {}, preferredId) =>
  (name && workspaces.find(item => item.name?.toLowerCase() === name.toLowerCase()))
  || cwdPatterns.map(pattern => workspaces.find(item => pattern.test(item.cwd || ''))).find(Boolean)
  || workspaces.find(item => item.id === preferredId)

export const HarnessFields = ({ form, inspector, client, workspace, preferredWorkspaceId }) => {
  const [providers, setProviders] = useState([])
  const [workspaces, setWorkspaces] = useState([])
  const setValue = form.setValue
  const setDefault = form.setDefault
  const provider = providers.find(item => item.id === form.values.provider)
  const models = provider?.models || []
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const promptDefault = inspector?.descriptor?.leaf ? `For ${inspector.descriptor.leaf} ` : ''
  const previousPrefix = useRef(promptDefault)
  const prompt = form.values.prompt
  const promptDirty = form.dirty?.prompt
  useEffect(() => {
    setDefault('prompt', promptDefault)
    if (promptDirty && prompt === previousPrefix.current && prompt !== promptDefault)
      setValue('prompt', promptDefault)
    previousPrefix.current = promptDefault
  }, [promptDefault, prompt, promptDirty, setDefault, setValue])
  const handledResponse = useRef(false)
  const [suppressPromptError, setSuppressPromptError] = useState(false)
  const promptDefaultRef = useRef(promptDefault)
  promptDefaultRef.current = promptDefault
  const hasResponse = form.hasResponse
  // A successful send restores the component prefix and leaves the other fields alone.
  useLayoutEffect(() => {
    if (!hasResponse) {
      handledResponse.current = false
      setSuppressPromptError(false)
      return
    }
    if (handledResponse.current) return
    handledResponse.current = true
    setSuppressPromptError(true)
    setValue('prompt', promptDefaultRef.current)
  }, [hasResponse, setValue])
  useFormReady(form, 'component', loaded && Boolean(provider?.implemented && !provider.error))
  const workspaceRef = useRef(workspace)
  workspaceRef.current = workspace
  useEffect(() => {
    let cancelled = false
    Promise.all([client.getProviders(), client.listWorkspaces()])
      .then(([result, { workspaces: nextWorkspaces }]) => {
        if (cancelled) return
        setProviders(result.providers)
        setWorkspaces(nextWorkspaces)
        const match = preferredWorkspace(nextWorkspaces, workspaceRef.current, preferredWorkspaceId)
        setValue('workspaceId', match?.id || '')
        const available = result.providers.filter(item => item.implemented && !item.error)
        const initial = available.find(item => item.id === 'cursor') || available[0]
        setValue('provider', initial?.id || '')
        setValue('model', initial?.models?.[0]?.id || '')
        setLoaded(true)
      })
      .catch(err => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [attempt, client, preferredWorkspaceId, setValue])

  const workspaceLabel = workspace?.label || workspace?.name || 'the workspace'
  return <DevScope id="1gd20wn" state={{ loaded, busy: form.isSubmitting }}>
    {error && <p role="alert">{error}. Check that the harness service is running.</p>}
    {!loaded && !error && <p role="status">Loading workspaces and providers…</p>}
    {loaded && !form.values.workspaceId && <p>Choose a workspace. If {workspaceLabel} is missing, create it in the harness and refresh.</p>}
    {loaded && !provider && <p>No available provider. Check the harness provider configuration and refresh.</p>}
    {provider?.error && <p role="alert">{provider.error}</p>}
    <button type="button" disabled={form.isSubmitting} onClick={() => {
      form.setReady('component', false)
      form.setValue('provider', '')
      form.setValue('model', '')
      setLoaded(false)
      setError(null)
      setAttempt(value => value + 1)
    }}>Refresh options</button>
    <DevScope id="2036i1d">
      <label className="form__label" htmlFor="harness-workspace">Workspace</label>
      <select id="harness-workspace" className="form__select" value={form.values.workspaceId}
        disabled={!loaded || form.isSubmitting} onChange={event => {
          form.setValue('workspaceId', event.target.value)
        }}>
        <option value="">Choose a workspace</option>
        {workspaces.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </DevScope>
    <DevScope id="44op6ej">
      <label className="form__label" htmlFor="harness-provider">Provider</label>
      <select id="harness-provider" className="form__select" value={form.values.provider}
        disabled={!loaded || form.isSubmitting} onChange={event => {
          const next = providers.find(item => item.id === event.target.value)
          form.setValue('provider', next?.id || '')
          form.setValue('model', next?.models?.[0]?.id || '')
        }}>
        <option value="">Choose a provider</option>
        {providers.map(item => <option key={item.id} value={item.id} disabled={!item.implemented || Boolean(item.error)}>
          {item.id}{!item.implemented || item.error ? ' (unavailable)' : ''}
        </option>)}
      </select>
    </DevScope>
    <DevScope id="9esxvp5">
      <label className="form__label" htmlFor="harness-model">Model</label>
      <select id="harness-model" className="form__select" value={form.values.model}
        disabled={!loaded || !provider || form.isSubmitting}
        onChange={event => form.setValue('model', event.target.value)}>
        <option value="">Provider default</option>
        {models.map(model => <option key={model.id} value={model.id}>{model.displayName || model.id}</option>)}
      </select>
    </DevScope>
    <p>Each submission creates a new session in the selected workspace.</p>
    <DevScope id="l42rkja">
      <label className="form__label" htmlFor="harness-action">Action</label>
      <select id="harness-action" className="form__select" value={form.values.action}
        disabled={form.isSubmitting} onChange={event => form.setValue('action', event.target.value)}>
        <option value="plan">Plan</option><option value="run">Run</option><option value="decompose">Decompose</option>
      </select>
    </DevScope>
    <DevScope id="wimkusb">
      <label className="form__label" htmlFor="harness-prompt">Prompt</label>
      <PromptInput client={client} id="harness-prompt" className="form__textarea" rows={5} value={form.values.prompt}
        disabled={form.isSubmitting} onChange={event => {
          setSuppressPromptError(false)
          form.setValue('prompt', event.target.value)
        }}
        onSubmit={form.submit} />
    </DevScope>
    {Object.entries(form.errors).map(([name, fieldError]) => form.touched[name] && fieldError
      && !(suppressPromptError && name === 'prompt')
      ? <p key={name} role="alert">{fieldError}</p> : null)}
  </DevScope>
}

const createHarnessForms = ({ client, workspace, preferredWorkspaceId }) => [{
  id: 'harness',
  title: 'Harness',
  icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3m6 0h4" />
  </svg>,
  component: HarnessFields,
  componentProps: { client, workspace, preferredWorkspaceId },
  submitLabel: 'Send to harness',
  config: { fields: {
    workspaceId: { type: 'select', defaultValue: '', required: true, requiredMessage: 'Choose a workspace' },
    provider: { type: 'select', defaultValue: '', required: true, requiredMessage: 'Choose a provider' },
    model: { type: 'select', defaultValue: '' },
    action: { type: 'select', defaultValue: 'run', required: true },
    prompt: { type: 'textarea', defaultValue: '', required: true, requiredMessage: 'Enter a prompt' },
  } },
  onSubmit: async ({ workspaceId, provider, model, action, prompt }) => {
    const { session } = await client.createSession({
      workspaceId,
      provider,
      model: model || null,
    })
    try {
      const response = action === 'run'
        ? await client.run(session.id, { prompt, mode: 'agent' })
        : await client[action](session.id, prompt)
      return { session, ...response }
    } catch (error) {
      const failure = new Error(`Session ${session.id} was created, but ${action} failed: ${error.message}. Submitting again will create another session.`)
      failure.sessionId = session.id
      throw failure
    }
  },
}]

export default createHarnessForms
