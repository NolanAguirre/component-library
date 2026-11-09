import { createElement } from 'react'
import createHarnessClient from './harnessClient'
import SessionExplorer from './sessionExplorer'

const harnessIcon = () => createElement('svg', {
  width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true,
},
  createElement('rect', { x: 3, y: 4, width: 18, height: 16, rx: 2 }),
  createElement('path', { d: 'm7 9 3 3-3 3m6 0h4' }),
)

/**
 * createHarnessPlugin — harness prompt and session logs for DevInspector.
 *
 *   const { forms, views } = createHarnessPlugin({ baseUrl: '/vpr/harness-api', workspace: { name: 'vpr' } })
 *   <DevInspector forms={forms} views={views}>…</DevInspector>
 *
 * The view has two tabs: Send (the harness prompt) and Logs (sessions and output).
 *
 * Options:
 *   client               {object}  — harness client (see harnessClient.js); used instead of baseUrl
 *   baseUrl              {string}  — harness API proxy path for the default fetch client
 *   workspace            {object}  — { name, cwdPatterns: RegExp[], label } used to preselect a workspace
 *   preferredWorkspaceId {string}  — fallback workspace id when nothing matches
 */
const createHarnessPlugin = ({ client, baseUrl, workspace, preferredWorkspaceId } = {}) => {
  const harness = client || createHarnessClient({ baseUrl })
  return {
    forms: [],
    views: [{
      id: 'harness',
      title: 'Harness',
      icon: harnessIcon(),
      component: SessionExplorer,
      props: { client: harness, workspace, preferredWorkspaceId },
    }],
  }
}

export default createHarnessPlugin
