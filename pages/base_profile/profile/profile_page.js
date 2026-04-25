import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/router'
import Link from 'next/link'

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/base_profile/login/login_page')
    }
  }, [status])

  useEffect(() => {
    if (status === 'authenticated') {
      fetch('/api/profile')
        .then(res => res.json())
        .then(data => {
          setProfile(data)
          setLoading(false)
        })
    }
  }, [status])

  if (status === 'loading' || loading) {
    return (
      <main style={styles.page}>
        <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', paddingTop: '4rem' }}>Loading...</p>
      </main>
    )
  }

  if (!profile) return null

  const initials = profile.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const LEVELS = [
    { name: 'Rookie',     max: 500 },
    { name: 'Challenger', max: 1000 },
    { name: 'Athlete',    max: 2000 },
    { name: 'Elite',      max: 3500 },
    { name: 'Legend',     max: Infinity },
  ]

  const currentLevel = LEVELS.find(l => profile.points < l.max) || LEVELS[LEVELS.length - 1]
  const prevMax = LEVELS[LEVELS.indexOf(currentLevel) - 1]?.max || 0
  const xpPct = currentLevel.max === Infinity
    ? 100
    : Math.round(((profile.points - prevMax) / (currentLevel.max - prevMax)) * 100)

  return (
    <main style={styles.page}>

      <nav style={styles.nav}>
        <span style={styles.navLogo}>Rep<span style={{ color: '#888' }}>Up</span></span>
        <div style={styles.navRight}>
          <Link href="/leaderboard" style={styles.navLink}>Leaderboard</Link>
          <button style={styles.logoutBtn} onClick={() => signOut({ callbackUrl: '/base_profile/login/login_page' })}>
            Log out
          </button>
        </div>
      </nav>

      <div style={styles.content}>

        <div style={styles.header}>
          <div style={styles.avatar}>{initials}</div>
          <div>
            <h1 style={styles.name}>{profile.name}</h1>
            <p style={styles.username}>@{profile.username}</p>
          </div>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{profile.points.toLocaleString()}</span>
            <span style={styles.statLbl}>total points</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{profile.workouts}</span>
            <span style={styles.statLbl}>workouts</span>
          </div>
          <div style={styles.statCard}>
            <span style={styles.statVal}>{profile.streak}</span>
            <span style={styles.statLbl}>day streak</span>
          </div>
        </div>

        <div style={styles.levelCard}>
          <div style={styles.levelRow}>
            <span style={styles.levelName}>{currentLevel.name}</span>
            <span style={styles.levelXp}>
              {profile.points.toLocaleString()} / {currentLevel.max === Infinity ? '∞' : currentLevel.max.toLocaleString()} pts
            </span>
          </div>
          <div style={styles.barBg}>
            <div style={{ ...styles.barFill, width: xpPct + '%' }} />
          </div>
          {currentLevel.max !== Infinity && (
            <p style={styles.levelHint}>
              {(currentLevel.max - profile.points).toLocaleString()} points to {LEVELS[LEVELS.indexOf(currentLevel) + 1]?.name}
            </p>
          )}
        </div>

        <div style={styles.section}>
          <p style={styles.sectionTitle}>Account</p>
          <div style={styles.detailCard}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Name</span>
              <span style={styles.detailValue}>{profile.name}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Username</span>
              <span style={styles.detailValue}>@{profile.username}</span>
            </div>
            <div style={styles.divider} />
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Member since</span>
              <span style={styles.detailValue}>
                {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f9f9f8',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.5rem',
    backgroundColor: '#fff',
    borderBottom: '0.5px solid #e0dfd8',
  },
  navLogo: {
    fontSize: '16px',
    fontWeight: '500',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  navLink: {
    fontSize: '13px',
    color: '#888',
    textDecoration: 'none',
  },
  logoutBtn: {
    fontSize: '13px',
    color: '#888',
    background: 'none',
    border: '0.5px solid #ddd',
    borderRadius: '8px',
    padding: '4px 10px',
    cursor: 'pointer',
  },
  content: {
    maxWidth: '480px',
    margin: '0 auto',
    padding: '2rem 1.5rem',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: '#e8e7e0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '500',
    color: '#444',
    flexShrink: 0,
  },
  name: {
    fontSize: '20px',
    fontWeight: '500',
    marginBottom: '2px',
  },
  username: {
    fontSize: '13px',
    color: '#888',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '1.25rem',
  },
  statCard: {
    backgroundColor: '#fff',
    border: '0.5px solid #e0dfd8',
    borderRadius: '12px',
    padding: '14px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statVal: {
    fontSize: '22px',
    fontWeight: '500',
  },
  statLbl: {
    fontSize: '11px',
    color: '#888',
  },
  levelCard: {
    backgroundColor: '#fff',
    border: '0.5px solid #e0dfd8',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '1.25rem',
  },
  levelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: '10px',
  },
  levelName: {
    fontSize: '15px',
    fontWeight: '500',
  },
  levelXp: {
    fontSize: '13px',
    color: '#888',
  },
  barBg: {
    height: '6px',
    backgroundColor: '#eee',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#111',
    borderRadius: '3px',
  },
  levelHint: {
    fontSize: '12px',
    color: '#aaa',
    marginTop: '8px',
  },
  section: {
    marginBottom: '1.25rem',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  detailCard: {
    backgroundColor: '#fff',
    border: '0.5px solid #e0dfd8',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
  detailLabel: {
    fontSize: '14px',
    color: '#888',
  },
  detailValue: {
    fontSize: '14px',
    color: '#111',
  },
  divider: {
    height: '0.5px',
    backgroundColor: '#e0dfd8',
    margin: '0 16px',
  },
}