import { Home } from 'lucide-react'
import './App.css'

export default function App() {
  return (
    <div className="cf-dashboard">
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="cf-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">C</div>
          <span className="brand-text">Dashboard</span>
        </div>

        <nav className="sidebar-nav">
          {/* Only one section: Home */}
          <button className="nav-item-single">
            <Home size={16} />
            <span>Home</span>
          </button>
        </nav>
      </aside>

      {/* ==================== PLACEHOLDER SECTION (MAIN) ==================== */}
      <main className="cf-placeholder-main">
        <div className="placeholder-container">
          <div className="placeholder-header">
            <h1 className="page-title">Home</h1>
            <p className="page-subtitle">Placeholder section description and details.</p>
          </div>

          <div className="placeholder-card">
            <h2 className="placeholder-card-title">Placeholder Section</h2>
            <p className="placeholder-card-text">
              This is placeholder text for your placeholder section. You can replace this text with your own content, widgets, tables, or controls.
            </p>
          </div>

          {/* Minimal set of buttons / list */}
          <div className="placeholder-card">
            <h2 className="placeholder-card-title">Placeholder List</h2>
            <div className="placeholder-list-buttons">
              <button className="placeholder-list-item">
                <span className="item-title">Placeholder Item 1</span>
                <span className="item-subtext">placeholder-route-1.dev</span>
              </button>
              <button className="placeholder-list-item">
                <span className="item-title">Placeholder Item 2</span>
                <span className="item-subtext">placeholder-route-2.dev</span>
              </button>
              <button className="placeholder-list-item">
                <span className="item-title">Placeholder Item 3</span>
                <span className="item-subtext">placeholder-route-3.dev</span>
              </button>
            </div>
          </div>

          {/* Stats Placeholder */}
          <div className="placeholder-grid">
            <div className="placeholder-stat-box">
              <span className="stat-label">Placeholder Metric A</span>
              <span className="stat-val">0.00</span>
            </div>
            <div className="placeholder-stat-box">
              <span className="stat-label">Placeholder Metric B</span>
              <span className="stat-val">100%</span>
            </div>
            <div className="placeholder-stat-box">
              <span className="stat-label">Placeholder Metric C</span>
              <span className="stat-val">Active</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
