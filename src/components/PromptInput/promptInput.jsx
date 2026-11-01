import { useEffect, useMemo, useState } from 'react'
import TextArea from '../TextArea/textArea'
import { findTriggers, parseTriggers } from '../../lib/promptTriggers'
import './styles.css'

// One trigger request per client. Failures are dropped so a remount retries.
const loaded = new WeakMap()
const loadTriggers = client => {
  if (!loaded.has(client)) {
    const request = Promise.resolve()
      .then(() => client.getPromptTriggers())
      .then(parseTriggers)
    request.catch(error => {
      loaded.delete(client)
      console.warn(`PromptInput: prompt triggers unavailable, highlighting off (${error.message})`)
    })
    loaded.set(client, request)
  }
  return loaded.get(client)
}

/**
 * PromptInput — TextArea that highlights harness prompt triggers and shows a
 * chip per firing trigger. Pass `triggers` directly, or a harness `client`
 * with `getPromptTriggers()`. Without triggers it is a plain textarea.
 * `steer` skips triggers steers cannot fire.
 */
const PromptInput = ({ triggers, client, steer = false, value, ...rest }) => {
  const [fetched, setFetched] = useState(null)

  useEffect(() => {
    if (triggers || typeof client?.getPromptTriggers !== 'function') return
    let cancelled = false
    loadTriggers(client)
      .then(next => { if (!cancelled) setFetched(next) })
      .catch(() => { if (!cancelled) setFetched(null) })
    return () => { cancelled = true }
  }, [client, triggers])

  const active = triggers || fetched
  const text = value == null ? '' : String(value)
  const matches = useMemo(() => (active ? findTriggers(text, active, { steer }) : null), [active, text, steer])
  const fired = useMemo(() => {
    if (!matches?.length) return []
    const ids = new Set(matches.map(match => match.id))
    return active.filter(trigger => ids.has(trigger.id))
  }, [active, matches])

  return (
    <TextArea {...rest} value={value} highlights={matches || undefined}>
      {fired.length > 0 && (
        <div className="prompt-input__chips">
          {fired.map(trigger => (
            <span key={trigger.id} className="prompt-input__chip" title={trigger.description}>
              {trigger.label}
            </span>
          ))}
        </div>
      )}
    </TextArea>
  )
}

export default PromptInput
