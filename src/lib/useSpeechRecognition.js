import { useCallback, useEffect, useRef, useState } from 'react'

const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const useSpeechRecognition = ({ lang = 'en-US', onFinal } = {}) => {
  const [supported] = useState(() => Boolean(getRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recognizerRef = useRef(null)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  const stop = useCallback(() => {
    if (recognizerRef.current) recognizerRef.current.stop()
  }, [])

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || recognizerRef.current) return
    const recognizer = new Ctor()
    recognizer.lang = lang
    recognizer.continuous = true
    recognizer.interimResults = true

    recognizer.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          if (text.trim() && onFinalRef.current) onFinalRef.current(text)
        } else {
          pending += text
        }
      }
      setInterim(pending.trim())
    }

    recognizer.onerror = (event) => {
      setError(event.error)
    }

    recognizer.onend = () => {
      if (recognizerRef.current === recognizer) recognizerRef.current = null
      setListening(false)
      setInterim('')
    }

    recognizerRef.current = recognizer
    setError(null)
    setInterim('')
    try {
      recognizer.start()
      setListening(true)
    } catch (err) {
      recognizerRef.current = null
      setError(err && err.message ? err.message : String(err))
    }
  }, [lang])

  const toggle = useCallback(() => {
    if (recognizerRef.current) stop()
    else start()
  }, [start, stop])

  useEffect(() => () => {
    const recognizer = recognizerRef.current
    recognizerRef.current = null
    if (recognizer) recognizer.abort()
  }, [])

  return { supported, listening, interim, error, start, stop, toggle }
}

export default useSpeechRecognition
