import { useState } from 'react'
import { DEMO_USERS } from './domain/auth.js'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import LoneMesaLogo from './components/LoneMesaLogo'
import bgImage from './assets/conocoBg.webp'
import './LoginScreen.css'

export default function LoginScreen({ onLogin }) {
  const [demoUserId, setDemoUserId] = useState('demo-planner')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e) => {
    e?.preventDefault()
    setIsLoading(true)

    setTimeout(() => {
      const trimmed = email.trim()
      const displayName = trimmed
        ? trimmed.includes('@')
          ? trimmed.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
          : trimmed
        : 'Operations Analyst'

      const initials = displayName
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'LM'

      const selected = DEMO_USERS.find(user => user.id === demoUserId)
      onLogin({ ...selected, ...(trimmed ? { name: displayName, email: trimmed, avatar: initials } : {}) }, rememberMe)

      setIsLoading(false)
    }, 200)
  }

  return (
    <div className="login-root">
      {/* Conoco North Sea background image with dark opacity overlay */}
      <div
        className="login-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
        aria-hidden="true"
      />

      {/* Top navigation bar */}
      {/* <header className="login-topbar">
        <div className="login-brand">
          <LoneMesaLogo height={26} textColor="#ffffff" />
        </div>
      </header>*/}

      {/* Main login container */}
      <main className="login-main">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-brand">
              <LoneMesaLogo height={22} textColor="#111827" />
            </div>
            <h1>Prototype sign-in</h1>
            <p>Choose a sample role to explore the maintenance workflow. Passwords are not checked.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-field"><label htmlFor="demo-user">Demo role</label><select id="demo-user" value={demoUserId} onChange={e => setDemoUserId(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px' }}>{DEMO_USERS.map(user => <option key={user.id} value={user.id}>{user.name} · {user.role.replaceAll('_', ' ')}</option>)}</select></div>
            <div className="form-field">
              <label htmlFor="login-email">Email or username</label>
              <div className="input-wrap">
                <Mail size={16} className="input-icon" />
                <input
                  id="login-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@lonemesa.com"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrap">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span>Remember me</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-primary-login"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        </div>

        {/* <footer className="login-page-footer">
          <LoneMesaLogo height={25} textColor="#94a3b8" />
        </footer>*/}
      </main>
    </div>
  )
}
