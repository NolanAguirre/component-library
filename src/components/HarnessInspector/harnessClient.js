// Plain fetch client for a harness API proxy (e.g. `/vpr/harness-api`).
// Method names match harness/ui/harness/src/api.js, so the harness UI can pass its own api instead.
const createHarnessClient = ({ baseUrl }) => {
  const base = baseUrl.replace(/\/$/, '')
  const fail = async (response) => {
    const detail = await response.json().catch(() => null)
    throw new Error(detail?.error || `Harness unavailable (${response.status})`)
  }
  const request = async (path, body, method = 'POST') => {
    const response = await fetch(`${base}${path}`, body === undefined ? {} : {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    if (!response.ok) await fail(response)
    return response.json()
  }
  const session = id => `/sessions/${encodeURIComponent(id)}`

  return {
    getProviders: () => request('/providers'),
    getPromptTriggers: () => request('/prompt-triggers'),
    listWorkspaces: () => request('/workspaces'),
    listSessions: (workspaceId, includeArchived = false, { orderBy, order, limit, active } = {}) => {
      const query = new URLSearchParams({ includeArchived: String(includeArchived) })
      if (orderBy !== undefined) query.set('orderBy', orderBy)
      if (order !== undefined) query.set('order', order)
      if (limit !== undefined) query.set('limit', String(limit))
      if (active !== undefined) query.set('active', String(active))
      const path = workspaceId ? `/workspaces/${encodeURIComponent(workspaceId)}/sessions` : '/sessions'
      return request(`${path}?${query}`)
    },
    createSession: ({ workspaceId, provider, model }) =>
      request(`/workspaces/${encodeURIComponent(workspaceId)}/sessions`, { provider, model }),
    setSessionArchived: (id, archived) => request(session(id), { archived }, 'PATCH'),
    plan: (id, prompt) => request(`${session(id)}/plan`, { prompt }),
    run: (id, { prompt, mode }) => request(`${session(id)}/run`, { prompt, mode }),
    decompose: (id, prompt) => request(`${session(id)}/decompose`, { prompt }),
    stopSession: id => request(`${session(id)}/stop`, {}),
    answerQuestion: (id, questionId, answer) => request(
      `${session(id)}/questions/${encodeURIComponent(questionId)}/answer`, { answer },
    ),
    getLog: async (id, { signal } = {}) => {
      const response = await fetch(`${base}${session(id)}/log`, { signal })
      if (!response.ok) await fail(response)
      return response.text()
    },
    eventsUrl: id => `${base}${session(id)}/events`,
  }
}

export default createHarnessClient
