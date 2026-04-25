import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError('')

    if (!name || !username || !password) {
      setError('Please fill in all fields.')
      return
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        username: username.toLowerCase(),
        password,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Something went wrong.')
      setLoading(false)
      return
    }

    router.push('/base_profile/login/login_page')
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>
          Rep<span style={styles.logoAccent}>Up</span>
        </h1>
        <p style={styles.subtitle}>Create your account to start training.</p>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Full name</label>
          <input
            style={styles.input}
            type="text"
            placeholder="Alex Johnson"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="alex_j"
            value={username}
            onChange={e => setUsername(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSignup()}
            autoComplete="new-password"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleSignup}
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <p style={styles.switchText}>
          Already have an account?{' '}
          <Link href="/base_profile/login/login_page" style={styles.link}>Log in</Link>
        </p>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
    backgroundColor: '#f9f9f8',
  },
  card: {
    width: '100%',
    maxWidth: '380px',
    backgroundColor: '#ffffff',
    border: '0.5px solid #e0dfd8',
    borderRadius: '16px',
    padding: '2rem',
  },
  logo: {
    fontSize: '24px',
    fontWeight: '500',
    marginBottom: '0.5rem',
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    color: '#888',
  },
  subtitle: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '1.5rem',
  },
  fieldGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    color: '#888',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: '15px',
    border: '0.5px solid #ddd',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#fff',
    color: '#111',
    boxSizing: 'border-box',
  },
  error: {
    fontSize: '13px',
    color: '#c0392b',
    marginBottom: '0.75rem',
  },
  btn: {
    width: '100%',
    padding: '10px',
    backgroundColor: '#111',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '0.25rem',
  },
  switchText: {
    fontSize: '13px',
    color: '#888',
    textAlign: 'center',
    marginTop: '1rem',
  },
  link: {
    color: '#111',
    textDecoration: 'underline',
  },
}