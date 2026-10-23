import { Home } from 'lucide-react'
import './App.css'

export default function App() {
  return (
    <div className="cf-dashboard flex min-h-screen bg-gray-50 text-gray-900 text-[13px] relative overflow-x-hidden antialiased">
      {/* ==================== LEFT SIDEBAR ==================== */}
      <aside className="cf-sidebar w-[220px] min-w-[220px] bg-white border-r border-gray-200 flex flex-col shrink-0 h-screen sticky top-0 select-none z-20">
        <div className="sidebar-brand p-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="brand-icon w-6.5 h-6.5 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            C
          </div>
          <span className="brand-text text-sm font-semibold text-gray-900 tracking-tight">
            Dashboard
          </span>
        </div>

        <nav className="sidebar-nav p-3 flex flex-col gap-1">
          {/* Only one section: Home */}
          <button className="nav-item-single flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors duration-150 w-full text-left">
            <Home size={16} />
            <span>Home</span>
          </button>
        </nav>
      </aside>

      {/* ==================== PLACEHOLDER SECTION (MAIN) ==================== */}
      <main className="cf-placeholder-main flex-1 min-w-0 p-8 sm:p-10 flex flex-col bg-gray-50">
        <div className="placeholder-container max-w-3xl w-full flex flex-col gap-5">
          <h1>Hello from casequest</h1>
          {/* <div className="placeholder-header mb-1.5">
            <h1 className="page-title text-2xl font-semibold text-gray-900 tracking-tight mb-1.5">
              Home
            </h1>
            <p className="page-subtitle text-[13.5px] text-gray-500 leading-relaxed">
              Placeholder section description and details.
            </p>
          </div>

          <div className="placeholder-card bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2.5 shadow-xs">
            <h2 className="placeholder-card-title text-sm font-semibold text-gray-900">
              Placeholder Section
            </h2>
            <p className="placeholder-card-text text-[13px] text-gray-500 leading-normal">
              This is placeholder text for your placeholder section. You can replace this text with your own content, widgets, tables, or controls.
            </p>
          </div>*/}

          {/* Minimal set of buttons / list */}
          {/* <div className="placeholder-card bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-2.5 shadow-xs">
            <h2 className="placeholder-card-title text-sm font-semibold text-gray-900">
              Placeholder List
            </h2>
            <div className="placeholder-list-buttons flex flex-col gap-2 mt-1">
              <button className="placeholder-list-item flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-slate-300 hover:shadow-xs transition-all duration-150 w-full text-left cursor-pointer group">
                <span className="item-title text-[13px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Placeholder Item 1
                </span>
                <span className="item-subtext text-xs text-gray-400">
                  placeholder-route-1.dev
                </span>
              </button>
              <button className="placeholder-list-item flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-slate-300 hover:shadow-xs transition-all duration-150 w-full text-left cursor-pointer group">
                <span className="item-title text-[13px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Placeholder Item 2
                </span>
                <span className="item-subtext text-xs text-gray-400">
                  placeholder-route-2.dev
                </span>
              </button>
              <button className="placeholder-list-item flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-md hover:bg-gray-50 hover:border-slate-300 hover:shadow-xs transition-all duration-150 w-full text-left cursor-pointer group">
                <span className="item-title text-[13px] font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  Placeholder Item 3
                </span>
                <span className="item-subtext text-xs text-gray-400">
                  placeholder-route-3.dev
                </span>
              </button>
            </div>
          </div>*/}

          {/* Stats Placeholder */}
          {/* <div className="placeholder-grid grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="placeholder-stat-box bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1 shadow-xs">
              <span className="stat-label text-xs text-gray-500">Placeholder Metric A</span>
              <span className="stat-val text-lg font-semibold text-gray-900">0.00</span>
            </div>
            <div className="placeholder-stat-box bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1 shadow-xs">
              <span className="stat-label text-xs text-gray-500">Placeholder Metric B</span>
              <span className="stat-val text-lg font-semibold text-gray-900">100%</span>
            </div>
            <div className="placeholder-stat-box bg-white border border-gray-200 rounded-lg p-4 flex flex-col gap-1 shadow-xs">
              <span className="stat-label text-xs text-gray-500">Placeholder Metric C</span>
              <span className="stat-val text-lg font-semibold text-gray-900">Active</span>
            </div>
          </div>*/}
        </div>
      </main>
    </div>
  )
}
