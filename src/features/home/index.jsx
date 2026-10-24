import { ArrowRight, MapPin, ShieldCheck } from 'lucide-react'
import { filterDataToUserScope, getRoleHomeModel, getWidgetComponent } from './homeModel.js'
import './home.css'

function WidgetFallback({ label }) {
  return <div className="home-widget-fallback"><strong>{label}</strong><span>No action needed right now.</span></div>
}

function WidgetSlot({ component, label, data, user }) {
  if (!component) return <WidgetFallback label={label} />
  const Widget = component
  return <Widget data={data} user={user} />
}

export default function Home({ data, user, widgetComponents = {}, onNavigate }) {
  const model = getRoleHomeModel(user, data)
  const scopedData = filterDataToUserScope(data, user)
  const navigate = (href) => {
    if (onNavigate) onNavigate(href)
    else window.location.hash = href.replace(/^#/, '')
  }
  const widgetLabels = {
    dispatch: 'Pre-dispatch check', earlyWarning: 'Active warnings', reorders: 'Reorder queue',
    hse: 'HSE gate', overview: 'Site status', siteStatus: 'Site status', simulator: 'Impact simulator',
  }

  return (
    <div className="home-page">
      <header className="home-header">
        <div><div className="home-eyebrow">{model.eyebrow}</div><h1>{model.title}</h1><p>{model.description}</p></div>
        <button className="home-primary-action" type="button" onClick={() => navigate(model.action.href)}>
          {model.action.label}<ArrowRight size={16} aria-hidden="true" />
        </button>
      </header>
      <div className="home-scope" aria-label="Current site scope">
        <MapPin size={15} aria-hidden="true" />
        <span><strong>Site scope</strong> {model.scope.label}</span>
        <span className="home-scope-note">{model.scope.isScoped ? 'Only authorized site data is shown' : 'Organization view'}</span>
      </div>
      <section className={`home-grid home-grid-${model.widgetKeys.length}`} aria-label={`${model.role} home actions`}>
        {model.widgetKeys.map((key) => (
          <article className={`home-widget home-widget-${key}`} key={key}>
            <WidgetSlot component={getWidgetComponent(widgetComponents, key)} label={widgetLabels[key] || key} data={scopedData} user={user} />
          </article>
        ))}
      </section>
      <aside className="home-safety-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <div><strong>Safety stays human-approved</strong><p>Parts readiness never replaces LOTO and isolation steps.</p></div>
      </aside>
    </div>
  )
}
