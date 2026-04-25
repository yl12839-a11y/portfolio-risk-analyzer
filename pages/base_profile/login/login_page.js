import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError('')

    if (!username || !password) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username: username.toLowerCase(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Incorrect username or password.')
        setLoading(false)
        return
      }

      const session = await getSession()
      const sessionUsername = session?.user?.username || username.toLowerCase()

      localStorage.setItem(
        'players',
        JSON.stringify([
          { name: sessionUsername, goal: 'strength', score: 0, completed: false },
        ])
      )
      localStorage.setItem('activePlayerIndex', '0')
      localStorage.setItem('username', sessionUsername)
      localStorage.setItem('gameComplete', 'false')

      router.push('/avatar')
    } catch (err) {
      setError(`Network error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.logo}>
          Rep<span style={styles.logoAccent}>Up</span>
        </h1>
        <p style={styles.subtitle}>Welcome back. Log in to continue.</p>

        <div style={styles.fieldGroup}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="your_username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
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
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoComplete="current-password"
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          style={{ ...styles.btn, opacity: loading ? 0.6 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>

        <p style={styles.switchText}>
          Don&apos;t have an account?{' '}
          <Link href="/base_profile/signup/signup_page" style={styles.link}>Sign up</Link>
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