import { useId, useRef, useState } from 'react'

const SessionQuestion = ({ client, sessionId, question }) => {
  const id = useId()
  const [selected, setSelected] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [answered, setAnswered] = useState(false)
  const [error, setError] = useState(null)
  const sending = useRef(false)
  const options = question.options || []
  const freeText = question.allowFreeText !== false
  const hasText = freeText && text.trim().length > 0
  const valid = selected.length > 0 || hasText

  const submit = async event => {
    event.preventDefault()
    if (!valid || sending.current || answered) return
    sending.current = true
    setBusy(true)
    setError(null)
    const answer = question.allowMultiple
      ? [...selected, ...(hasText ? [text] : [])]
      : hasText ? text : selected[0]
    try {
      await client.answerQuestion(sessionId, question.id, answer)
      setAnswered(true)
      setText('')
    } catch (err) {
      setError(err.message)
    } finally {
      sending.current = false
      setBusy(false)
    }
  }

  return (
    <form className="harness-explorer__question" onSubmit={submit}>
      <fieldset disabled={busy || answered}>
        <legend>{question.question}</legend>
        {typeof question.details === 'string' && <p>{question.details}</p>}
        {options.map((option, index) => (
          <label key={index} className="harness-explorer__option">
            <input
              type={question.allowMultiple ? 'checkbox' : 'radio'}
              name={`${id}-option`}
              value={option}
              checked={selected.includes(option)}
              onChange={event => {
                setSelected(current => question.allowMultiple
                  ? event.target.checked ? [...current, option] : current.filter(item => item !== option)
                  : [option])
                if (!question.allowMultiple) setText('')
              }}
            />
            <span>{option}{typeof question.optionDescriptions?.[index] === 'string'
              && <small> — {question.optionDescriptions[index]}</small>}</span>
          </label>
        ))}
        {freeText && (
          <label htmlFor={`${id}-answer`}>
            {options.length ? 'Your own answer' : 'Answer'}
            {question.secret ? (
              <input id={`${id}-answer`} type="password" autoComplete="off" value={text}
                onChange={event => { setText(event.target.value); if (!question.allowMultiple) setSelected([]) }} />
            ) : (
              <textarea id={`${id}-answer`} rows={3} value={text}
                onChange={event => { setText(event.target.value); if (!question.allowMultiple) setSelected([]) }} />
            )}
          </label>
        )}
        <button type="submit" disabled={!valid || busy || answered}>
          {answered ? 'Answer sent' : busy ? 'Sending…' : 'Send answer'}
        </button>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      {answered && <p role="status">Answer sent.</p>}
    </form>
  )
}

export default SessionQuestion
