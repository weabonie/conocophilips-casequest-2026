import { DataProvider } from './app/DataContext'
import { SelectionProvider } from './app/SelectionContext'
import AppShell from './app/AppShell'
import WorkspaceErrorBoundary from './app/WorkspaceErrorBoundary'
import './App.css'
import './styles/tokens.css'
export default function App() { return <WorkspaceErrorBoundary><DataProvider><SelectionProvider><AppShell /></SelectionProvider></DataProvider></WorkspaceErrorBoundary> }
