import createHarnessClient from './harnessClient'
import createHarnessForms from './harnessForms'
import SessionExplorer from './sessionExplorer'

/**
 * createHarnessPlugin — harness form and session view for DevInspector.
 *
 *   const { forms, views } = createHarnessPlugin({ baseUrl: '/vpr/harness-api', workspace: { name: 'vpr' } })
 *   <DevInspector forms={forms} views={views}>…</DevInspector>
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
    forms: createHarnessForms({ client: harness, workspace, preferredWorkspaceId }),
    views: [{ id: 'harness-sessions', title: 'Harness sessions', icon: '☷', component: SessionExplorer, props: { client: harness } }],
  }
}

export default createHarnessPlugin
