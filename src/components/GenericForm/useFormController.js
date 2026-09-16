import { useCallback, useEffect, useRef, useState } from 'react'
import createFormManager from '../Form/formManager'

// Config is fixed for a mounted form. Change its React key to replace it.
export default function useFormController(config = {}, onSubmit, custom = false) {
  const [manager] = useState(() => createFormManager(config))
  const [state, setState] = useState(manager.getState)
  const [response, setResponse] = useState(undefined)
  const [error, setError] = useState(null)
  const [hasResponse, setHasResponse] = useState(false)
  const [ready, setReady] = useState(false)
  const mounted = useRef(false)
  const gates = useRef(new Map())
  const [expected] = useState(() => [...(config.ready ?? []), ...(custom ? ['component'] : [])])
  const refreshReady = useCallback(() => {
    setReady(mounted.current && expected.every(id => gates.current.get(id) === true)
      && [...gates.current.values()].every(Boolean))
  }, [expected])
  const setReadyFor = useCallback((id, value) => {
    gates.current.set(id, Boolean(value))
    refreshReady()
  }, [refreshReady])
  useEffect(() => {
    mounted.current = true
    const unsubscribe = manager.subscribe(setState)
    setState(manager.getState())
    refreshReady()
    return () => { mounted.current = false; unsubscribe() }
  }, [manager, refreshReady])

  return {
    ...state, fields: config.fields ?? {}, response, error, hasResponse,
    isReady: ready, setReady: setReadyFor,
    setValue: manager.setValue, setTouched: manager.setTouched,
    onChange: manager.onChange, onBlur: manager.onBlur,
    validate: manager.validate, format: manager.format,
    reset: () => {
      if (manager.getState().isSubmitting) return
      manager.reset(); setResponse(undefined); setHasResponse(false); setError(null)
    },
    submit: async () => {
      if (!mounted.current || manager.getState().isSubmitting
        || !expected.every(id => gates.current.get(id) === true)
        || ![...gates.current.values()].every(Boolean)) return { success: false }
      manager.setIsSubmitting(true)
      setError(null)
      setHasResponse(false)
      try {
        const { isValid, errors } = manager.validate()
        if (!isValid) return { success: false, errors }
        // Preserve false, empty strings and null: the receiving API owns omission semantics.
        const values = manager.format()
        const result = await onSubmit?.(values)
        if (mounted.current) { setResponse(result); setHasResponse(true) }
        return { success: true, values, response: result }
      } catch (err) {
        if (mounted.current) setError(err instanceof Error ? err.message : String(err))
        return { success: false, error: err }
      } finally {
        manager.setIsSubmitting(false)
      }
    },
  }
}

// Use for every asynchronous/conditional child; declare deferred children in config.ready.
export function useFormReady(form, id, ready = true) {
  const setReady = form.setReady
  useEffect(() => {
    setReady(id, ready)
    return () => setReady(id, false)
  }, [setReady, id, ready])
}
