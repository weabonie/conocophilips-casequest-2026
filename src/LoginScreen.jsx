import { useState } from 'react'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import LoneMesaLogo from './components/LoneMesaLogo'
import './LoginScreen.css'

export default function LoginScreen({ onLogin }) {
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

      onLogin({
        id: 'user',
        name: displayName,
        role: 'Operations Analyst',
        email: trimmed || 'user@lonemesa.com',
        avatar: initials
      }, rememberMe)

      setIsLoading(false)
    }, 200)
  }

  return (
    <div className="login-root">
      {/* Schematic background grid matching dashboard site map */}
      <div className="login-bg" aria-hidden="true">
        <svg viewBox="0 0 1440 900" preserveAspectRatio="none">
          <defs>
            <pattern id="login-grid-pat" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe5df" strokeWidth="0.75" />
            </pattern>
            <radialGradient id="login-vignette" cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="70%" stopColor="#f9fafb" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#f9fafb" stopOpacity="0.98" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid-pat)" />
          <path className="login-terrain" d="M -50 180 Q 250 50 600 200 T 1500 130" />
          <path className="login-terrain" d="M -50 215 Q 250 85 600 235 T 1500 165" />
          <path className="login-terrain" d="M -50 250 Q 250 120 600 270 T 1500 200" />
          <path className="login-terrain" d="M -50 680 Q 320 520 800 660 T 1500 590" />
          <path className="login-terrain" d="M -50 715 Q 320 555 800 695 T 1500 625" />
          <rect width="100%" height="100%" fill="url(#login-vignette)" />
        </svg>
      </div>

      {/* Top navigation bar */}
      <header className="login-topbar">
        <div className="login-brand">
          <LoneMesaLogo height={26} textColor="#111827" />
        </div>
      </header>

      {/* Main login container */}
      <main className="login-main">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-brand">
              <LoneMesaLogo height={22} textColor="#111827" />
            </div>
            <h1>Dashboard login</h1>
            <p>Enter your credentials to access the operations overview.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
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
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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

        <footer className="login-page-footer">
          <LoneMesaLogo height={13} textColor="#6b7280" />
          <span>·</span>
          <span>Operations Overview</span>
        </footer>
      </main>
    </div>
  )
}
