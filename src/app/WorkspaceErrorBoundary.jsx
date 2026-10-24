import { Component } from 'react'
export default class WorkspaceErrorBoundary extends Component {
 state = { failed: false }
 static getDerivedStateFromError() { return { failed: true } }
 render() {
  if (this.state.failed) return <main className="page-content"><section className="panel cq-empty" role="alert"><h1>Reload the workspace</h1><p>A workspace module could not be loaded. Reload to use the latest version; saved demo decisions stay in this browser.</p><button className="primary-button" onClick={()=>window.location.reload()}>Reload workspace</button></section></main>
  return this.props.children
 }
}
