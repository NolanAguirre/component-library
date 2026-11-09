import { useCallback, useEffect, useRef, useState } from 'react'

const getRecognitionCtor = () => {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

const errorMessage = (code) => ({
  network: 'The browser could not reach its speech service. Local recognition is unavailable in this browser. Try a browser with on-device speech support, or check your connection and VPN.',
  'not-allowed': 'Allow microphone access for this site in your browser settings.',
  'service-not-allowed': 'Speech recognition is disabled by this browser or its settings.',
  'audio-capture': 'No microphone is available. Check your microphone and system permissions.',
  'no-speech': 'No speech was detected. Try again and speak into the microphone.',
  'language-not-supported': 'This browser does not support dictation in the selected language.',
})[code] || code

const useSpeechRecognition = ({ lang = 'en-US', onFinal } = {}) => {
  const [supported] = useState(() => Boolean(getRecognitionCtor()))
  const [listening, setListening] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [status, setStatus] = useState('')
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)
  const recognizerRef = useRef(null)
  const attemptRef = useRef(null)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  }, [onFinal])

  const stop = useCallback(() => {
    attemptRef.current = null
    setPreparing(false)
    setStatus('')
    const recognizer = recognizerRef.current
    if (recognizer) {
      try { recognizer.stop() } catch { /* It may still be starting. */ }
    }
  }, [])

  const start = useCallback(async () => {
    const Ctor = getRecognitionCtor()
    if (!Ctor || recognizerRef.current || attemptRef.current) return
    if (window.isSecureContext === false) {
      setError('Open Harness over HTTPS or localhost to use the microphone.')
      return
    }
    const attempt = {}
    attemptRef.current = attempt
    setError(null)
    setInterim('')
    setPreparing(true)
    setStatus('Preparing dictation…')
    let recognizer
    try {
      recognizer = new Ctor()
      recognizer.lang = lang
      recognizer.continuous = true
      recognizer.interimResults = true

      // Prefer on-device recognition: the default uses a browser-owned remote
      // service that can fail even when the app's own API is reachable.
      if ('processLocally' in recognizer && typeof Ctor.available === 'function') {
        let availability
        try {
          availability = await Ctor.available({ langs: [lang], processLocally: true })
        } catch {
          // Older browsers or permissions policies may only allow remote speech.
          availability = 'unavailable'
        }
        if (attemptRef.current !== attempt) return
        if (availability === 'downloadable' || availability === 'downloading') {
          if (typeof Ctor.install === 'function') {
            setStatus('Downloading the dictation language pack…')
            const installed = await Ctor.install({ langs: [lang], processLocally: true })
            if (attemptRef.current !== attempt) return
            if (!installed) throw new Error('Could not download the dictation language pack. Check your connection and try again.')
            availability = await Ctor.available({ langs: [lang], processLocally: true })
            if (attemptRef.current !== attempt) return
            if (availability !== 'available') throw new Error('The dictation language pack is not ready. Try again shortly.')
          }
        }
        recognizer.processLocally = availability === 'available'
      }
      if (attemptRef.current !== attempt) return

      recognizer.onresult = (event) => {
        if (recognizerRef.current !== recognizer) return
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

      recognizer.onstart = () => {
        if (recognizerRef.current !== recognizer) return
        if (attemptRef.current !== attempt) {
          recognizer.abort()
          return
        }
        setPreparing(false)
        setStatus('')
        setListening(true)
      }
      recognizer.onerror = (event) => {
        if (recognizerRef.current !== recognizer || event.error === 'aborted') return
        setError(event.error === 'network' && recognizer.processLocally
          ? 'The local speech engine failed. Check your browser’s speech settings and language pack.'
          : errorMessage(event.error))
      }
      recognizer.onend = () => {
        if (recognizerRef.current !== recognizer) return
        recognizerRef.current = null
        attemptRef.current = null
        setListening(false)
        setPreparing(false)
        setStatus('')
        setInterim('')
      }

      recognizerRef.current = recognizer
      recognizer.start()
    } catch (err) {
      if (attemptRef.current !== attempt) return
      attemptRef.current = null
      if (recognizerRef.current === recognizer) recognizerRef.current = null
      setListening(false)
      setPreparing(false)
      setStatus('')
      setError(err && err.message ? err.message : String(err))
    }
  }, [lang])

  const toggle = useCallback(() => {
    if (recognizerRef.current || attemptRef.current) stop()
    else start()
  }, [start, stop])

  useEffect(() => () => {
    attemptRef.current = null
    const recognizer = recognizerRef.current
    recognizerRef.current = null
    if (recognizer) recognizer.abort()
  }, [])

  return { supported, listening, preparing, status, interim, error, start, stop, toggle }
}

export default useSpeechRecognition
