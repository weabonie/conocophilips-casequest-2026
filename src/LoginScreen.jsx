import { useState } from 'react'
import { Mail, ShieldCheck, UserRound } from 'lucide-react'
import LoneMesaLogo from './components/LoneMesaLogo'
import { DEMO_USERS, ROLE_LABELS, ROLES } from './domain/auth.js'
import './LoginScreen.css'

function roleForEmail(value) {
  const email = value.toLowerCase()
  if (email.includes('hse') || email.includes('supervisor')) return ROLES.HSE_SUPERVISOR
  if (email.includes('site') || email.includes('lead')) return ROLES.SITE_LEAD
  if (email.includes('tech') || email.includes('dispatch')) return ROLES.TECHNICIAN
  if (email.includes('planner')) return ROLES.PLANNER
  return ROLES.OPS_MANAGER
}

export default function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const chooseUser = (user) => {
    setIsLoading(true)
    window.setTimeout(() => {
      onLogin(user)
      setIsLoading(false)
    }, 120)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const role = roleForEmail(email.trim())
    const user = DEMO_USERS.find((candidate) => candidate.role === role) || DEMO_USERS[0]
    chooseUser(user)
  }

  return (
    <div className="login-root">
      <div className="login-bg" aria-hidden="true"><svg viewBox="0 0 1440 900" preserveAspectRatio="none"><defs><pattern id="login-grid-pat" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe5df" strokeWidth="0.75" /></pattern><radialGradient id="login-vignette" cx="50%" cy="45%" r="60%"><stop offset="0%" stopColor="#ffffff" stopOpacity="0" /><stop offset="70%" stopColor="#f9fafb" stopOpacity=".75" /><stop offset="100%" stopColor="#f9fafb" stopOpacity=".98" /></radialGradient></defs><rect width="100%" height="100%" fill="url(#login-grid-pat)" /><path className="login-terrain" d="M -50 180 Q 250 50 600 200 T 1500 130" /><path className="login-terrain" d="M -50 215 Q 250 85 600 235 T 1500 165" /><path className="login-terrain" d="M -50 250 Q 250 120 600 270 T 1500 200" /><path className="login-terrain" d="M -50 680 Q 320 520 800 660 T 1500 590" /><path className="login-terrain" d="M -50 715 Q 320 555 800 695 T 1500 625" /><rect width="100%" height="100%" fill="url(#login-vignette)" /></svg></div>
      <header className="login-topbar"><div className="login-brand"><LoneMesaLogo height={26} textColor="#111827" /></div></header>
      <main className="login-main">
        <div className="login-card login-card-wide">
          <div className="login-card-header">
            <div className="login-card-brand"><LoneMesaLogo height={22} textColor="#111827" /></div>
            <div className="login-eyebrow"><ShieldCheck size={13} /> Prototype sign-in</div>
            <h1>Choose a demo role</h1>
            <p>Use a fictional user to preview the Control Tower with real role permissions.</p>
          </div>
          <div className="demo-user-grid" aria-label="Demo users">
            {DEMO_USERS.map((user) => <button type="button" className="demo-user-button" key={user.id} onClick={() => chooseUser(user)} disabled={isLoading}><span className="demo-user-avatar"><UserRound size={15} /></span><span><strong>{user.name}</strong><small>{ROLE_LABELS[user.role]}</small></span></button>)}
          </div>
          <div className="login-divider"><span>or use the secondary email path</span></div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field"><label htmlFor="login-email">Email or role hint</label><div className="input-wrap"><Mail size={16} className="input-icon" /><input id="login-email" type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="planner@lonemesa.com" autoComplete="username" /></div></div>
            <p className="login-helper">No password is checked in this prototype. Try planner, technician, hse, site lead, or manager in the field.</p>
            <button type="submit" className="btn-primary-login" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Continue'}</button>
          </form>
        </div>
        <footer className="login-page-footer"><LoneMesaLogo height={13} textColor="#6b7280" /><span>·</span><span>Critical Spares Control Tower</span></footer>
      </main>
    </div>
  )
}
