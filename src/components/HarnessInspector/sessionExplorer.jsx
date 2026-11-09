import { useEffect, useRef, useState } from 'react'
import Badge from '../Badge/badge'
import ScrollingText from '../ScrollingText/scrollingText'
import SessionQuestion from './sessionQuestion'
import { DevScope } from '../DevInspector/devInspector'
import GenericForm from '../GenericForm/genericForm'
import createHarnessForms from './harnessForms'
import './styles.css'

const JOB_LIST_LIMIT = 20

const STATUS_VARIANT = {
  idle: 'neutral',
  running: 'info',
  awaiting_input: 'warning',
  paused: 'warning',
  disconnected: 'danger',
  stopped: 'neutral',
  finished: 'success',
  error: 'danger',
}

const isActiveJob = job => job.status === 'running' || job.status === 'awaiting_input'

export const HarnessTabs = ({ tab, onTab, send, logs, label = 'Harness' }) => (
  <div className="harness-tabs">
    <div className="harness-explorer__filters" role="tablist" aria-label={label}>
      <button type="button" role="tab" aria-selected={tab === 'send'}
        className={`harness-explorer__filter${tab === 'send' ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => onTab('send')}>
        Send
      </button>
      <button type="button" role="tab" aria-selected={tab === 'logs'}
        className={`harness-explorer__filter${tab === 'logs' ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => onTab('logs')}>
        Logs
      </button>
    </div>
    <div role="tabpanel" hidden={tab !== 'send'}>{send}</div>
    <div role="tabpanel" hidden={tab !== 'logs'}>{logs}</div>
  </div>
)

const HarnessSend = ({ client, workspace, preferredWorkspaceId, inspector, onSession }) => {
  const [harnessForm] = createHarnessForms({ client, workspace, preferredWorkspaceId })
  return (
    <GenericForm
      config={harnessForm.config}
      component={harnessForm.component}
      componentProps={{ ...harnessForm.componentProps, inspector }}
      submitLabel={harnessForm.submitLabel}
      onSubmit={async values => {
        try {
          const response = await harnessForm.onSubmit(values)
          if (response?.session?.id) onSession(response.session.id)
          return response
        } catch (error) {
          if (error?.sessionId) onSession(error.sessionId)
          throw error
        }
      }}
    />
  )
}

const jobLabel = job => job.name || (job.model ? `${job.provider} · ${job.model}` : job.provider)

const JobRow = ({ devId, job, workspaceName, active, onSelect }) => {
  const label = jobLabel(job)
  return (
    <DevScope id={devId} state={{ job: job.id, active }}>
      <button
        type="button"
        className={`harness-explorer__job${active ? ' harness-explorer__job--active' : ''}`}
        aria-pressed={active}
        onClick={() => onSelect(job)}
      >
        <span className="harness-explorer__job-info">
          {isActiveJob(job) && <span className="harness-explorer__pulse" aria-hidden="true" />}
          <ScrollingText className="harness-explorer__job-label" title={label}>{label}</ScrollingText>
          {workspaceName && <span className="harness-explorer__ws">{workspaceName}</span>}
        </span>
        <Badge size="small" variant={STATUS_VARIANT[job.status] || 'neutral'}>{job.status}</Badge>
      </button>
    </DevScope>
  )
}

export const SessionStream = ({ client, sessionId, onSessionChange }) => {
  const [events, setEvents] = useState([])
  const [session, setSession] = useState(null)
  const [runs, setRuns] = useState([])
  const [questions, setQuestions] = useState([])
  const [status, setStatus] = useState('Connecting…')
  const [log, setLog] = useState('')
  const [logError, setLogError] = useState(null)
  const [follow, setFollow] = useState(true)
  const [stopping, setStopping] = useState(false)
  const [stopError, setStopError] = useState(null)
  const [stopRequested, setStopRequested] = useState(false)
  const [pane, setPane] = useState('events')
  const transcript = useRef(null)
  const logBox = useRef(null)
  const onSessionChangeRef = useRef(onSessionChange)
  onSessionChangeRef.current = onSessionChange

  useEffect(() => {
    const source = new EventSource(client.eventsUrl(sessionId))
    source.onopen = () => {
      setEvents([])
      setStatus('Replaying…')
    }
    const read = handler => event => {
      try { handler(JSON.parse(event.data)) } catch { setStatus('Invalid stream data') }
    }
    source.addEventListener('event', read(event => setEvents(previous => [...previous, event].slice(-500))))
    source.addEventListener('session', read(next => {
      setSession(next)
      onSessionChangeRef.current?.(next)
    }))
    source.addEventListener('runs', read(setRuns))
    source.addEventListener('questions', read(setQuestions))
    source.addEventListener('ready', () => setStatus('Live'))
    source.onerror = event => {
      if (event.data) {
        try { setStatus(JSON.parse(event.data).message) } catch { setStatus('Stream error') }
        source.close()
      } else setStatus('Disconnected — reconnecting…')
    }
    return () => source.close()
  }, [client, sessionId])

  useEffect(() => {
    const controller = new AbortController()
    let timer
    const load = async () => {
      try {
        const text = await client.getLog(sessionId, { signal: controller.signal })
        if (!controller.signal.aborted) {
          setLog(text.slice(-50000))
          setLogError(null)
        }
      } catch (error) {
        if (!controller.signal.aborted) setLogError(error.message)
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(load, 3000)
      }
    }
    load()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [client, sessionId])

  useEffect(() => {
    if (!follow) return
    const node = pane === 'log' ? logBox.current : transcript.current
    if (node) node.scrollTop = node.scrollHeight
  }, [events, log, follow, pane])

  return <DevScope id="uwqzq0x">
  <section>
    <p role="status">{status}{session ? ` · ${session.status} · ${session.provider} · ${session.model || 'default model'}` : ''}</p>
    {client.stopSession && ['running', 'awaiting_input', 'subagent'].includes(session?.status) && (
      <button type="button" disabled={stopping} onClick={async () => {
        setStopping(true)
        setStopError(null)
        try {
          await client.stopSession(sessionId)
          setStopRequested(true)
        } catch (error) {
          setStopError(error.message)
        } finally {
          setStopping(false)
        }
      }}>{stopping ? 'Stopping…' : 'Stop run'}</button>
    )}
    {stopRequested && <p role="status">Stop requested.</p>}
    {stopError && <p role="alert">{stopError}</p>}
    {client.answerQuestion && questions.filter(question => question.status === 'pending').map(question => (
      <SessionQuestion key={question.id} client={client} sessionId={sessionId} question={question} />
    ))}
    <div className="harness-explorer__filters" role="tablist" aria-label="Session output">
      <button type="button" role="tab" aria-selected={pane === 'events'}
        className={`harness-explorer__filter${pane === 'events' ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => setPane('events')}>
        Events
      </button>
      <button type="button" role="tab" aria-selected={pane === 'log'}
        className={`harness-explorer__filter${pane === 'log' ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => setPane('log')}>
        Log
      </button>
    </div>
    <DevScope id="q1sj1gg">
      <label><input type="checkbox" checked={follow} onChange={event => setFollow(event.target.checked)} /> Follow latest</label>
    </DevScope>
    {pane === 'events' ? <>
      <p>Latest 500 events</p>
      <div className="harness-explorer__events" ref={transcript} tabIndex={0} aria-label="Session events">
        {!events.length && <p>No events yet.</p>}
        {events.map((event, index) => <details key={index} open={event.type === 'text' || event.type === 'error'}>
          <summary>{event.type || 'event'}{event.status ? ` · ${event.status}` : ''}</summary>
          <pre>{typeof event.text === 'string' ? event.text : JSON.stringify(event, null, 2)}</pre>
        </details>)}
      </div>
      <details><summary>Runs ({runs.length})</summary><pre>{JSON.stringify(runs, null, 2)}</pre></details>
      {!client.answerQuestion && <details><summary>Pending questions ({questions.filter(question => question.status === 'pending').length})</summary>
        <pre>{JSON.stringify(questions.filter(question => question.status === 'pending'), null, 2)}</pre>
      </details>}
    </> : (
      <div className="harness-explorer__events harness-explorer__log" ref={logBox} tabIndex={0} aria-label="Process log">
        <p>Refreshes every 3 seconds</p>
        {logError && <p role="alert">{logError}</p>}
        <pre>{log || 'No process output yet.'}</pre>
      </div>
    )}
  </section>
  </DevScope>
}

const SessionExplorer = ({ client, workspace, preferredWorkspaceId, inspector }) => {
  const [workspaces, setWorkspaces] = useState([])
  const [jobs, setJobs] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [tab, setTab] = useState('send')
  const [filterActiveOnly, setFilterActiveOnly] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [archiveBusy, setArchiveBusy] = useState(false)
  const [archiveError, setArchiveError] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [workspaceData, activeData] = await Promise.all([
          client.listWorkspaces(),
          client.listSessions(null, false, { orderBy: 'createdAt', order: 'desc', active: true, limit: JOB_LIST_LIMIT }),
        ])
        if (cancelled) return
        const activeJobs = activeData.sessions
        let nextJobs = activeJobs
        if (activeJobs.length < JOB_LIST_LIMIT) {
          const recentData = await client.listSessions(null, false, {
            orderBy: 'createdAt', order: 'desc', active: false, limit: JOB_LIST_LIMIT - activeJobs.length,
          })
          if (cancelled) return
          const activeIds = new Set(activeJobs.map(job => job.id))
          const byRecent = (a, b) => (b.createdAt || 0) - (a.createdAt || 0) || a.id.localeCompare(b.id)
          nextJobs = [...activeJobs, ...recentData.sessions.filter(job => !activeIds.has(job.id))].sort(byRecent)
        }
        setWorkspaces(workspaceData.workspaces)
        setJobs(nextJobs)
        setError(null)
      } catch (loadError) {
        if (!cancelled) setError(loadError.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    const timer = setInterval(load, 3000)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [client, refresh])

  const nameById = Object.fromEntries(workspaces.map(item => [item.id, item.name]))
  const activeJobs = jobs.filter(isActiveJob)
  const displayedJobs = filterActiveOnly ? activeJobs : jobs
  const selected = jobs.find(job => job.id === sessionId)
  const toggleArchive = async () => {
    if (!selected || archiveBusy) return
    setArchiveBusy(true)
    setArchiveError(null)
    try {
      const { session } = await client.setSessionArchived(selected.id, !selected.archived)
      if (session.archived) {
        setJobs(current => current.filter(job => job.id !== session.id))
        setSessionId('')
      } else setJobs(current => current.map(job => job.id === session.id ? { ...job, ...session } : job))
      setRefresh(value => value + 1)
    } catch (archiveFailure) {
      setArchiveError(archiveFailure.message)
    } finally {
      setArchiveBusy(false)
    }
  }
  return <DevScope id="jan0d4r">
  <HarnessTabs
    tab={tab}
    onTab={setTab}
    send={<HarnessSend client={client} workspace={workspace} preferredWorkspaceId={preferredWorkspaceId} inspector={inspector} onSession={setSessionId} />}
    logs={<div className="harness-explorer">
    <div className="harness-explorer__jobs-header">
      <h3>Jobs</h3>
      <Badge size="small" variant={activeJobs.length ? 'info' : 'neutral'} count={activeJobs.length} />
      <button type="button" onClick={() => setRefresh(value => value + 1)}>Refresh</button>
    </div>
    {loading && <p role="status">Loading jobs…</p>}
    {error && <p role="alert">{error}</p>}
    <div className="harness-explorer__filters" role="tablist" aria-label="Job filters">
      <button type="button" role="tab" aria-selected={!filterActiveOnly}
        className={`harness-explorer__filter${!filterActiveOnly ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => setFilterActiveOnly(false)}>
        All ({jobs.length})
      </button>
      <button type="button" role="tab" aria-selected={filterActiveOnly}
        className={`harness-explorer__filter${filterActiveOnly ? ' harness-explorer__filter--active' : ''}`}
        onClick={() => setFilterActiveOnly(true)}>
        Active ({activeJobs.length})
      </button>
    </div>
    <div className="harness-explorer__jobs" aria-label="Jobs">
      {!loading && !error && !displayedJobs.length && (
        <p className="harness-explorer__empty">{filterActiveOnly ? 'No active background jobs.' : 'No recent jobs.'}</p>
      )}
      {displayedJobs.map(job => (
        <JobRow
          key={job.id}
          devId="0ub30z7"
          job={job}
          workspaceName={nameById[job.workspaceId] || job.cwd}
          active={job.id === sessionId}
          onSelect={item => setSessionId(item.id)}
        />
      ))}
    </div>
    {archiveError && <p role="alert">{archiveError}</p>}
    {selected && <button type="button" disabled={archiveBusy} onClick={toggleArchive}>
      {selected.archived ? 'Unarchive session' : 'Archive session'}
    </button>}
    {sessionId && <SessionStream key={sessionId} client={client} sessionId={sessionId} />}
  </div>}
  />
  </DevScope>
}

export default SessionExplorer
