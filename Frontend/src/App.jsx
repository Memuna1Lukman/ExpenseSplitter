import { useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { InviteAcceptancePage } from './pages/InviteAcceptancePage'
import { useAuth } from './hooks/useAuth'
import './App.css'

function getInviteToken() {
  const url = new URL(window.location.href)
  return url.pathname === '/invites/accept' ? url.searchParams.get('token') : null
}

export default function App() {
  const { user, loading, error, signIn, signUp, signOut, setError } = useAuth()
  const [authMode, setAuthMode] = useState('signin')
  const [inviteToken, setInviteToken] = useState(getInviteToken)
  const [screen, setScreen] = useState(() => (inviteToken ? 'auth' : 'landing'))

  const finishInvite = () => {
    window.history.replaceState({}, '', '/')
    setInviteToken(null)
  }

  if (!user) {
    if (screen === 'landing') {
      return (
        <LandingPage
          onGetStarted={() => {
            setError(null)
            setAuthMode('signup')
            setScreen('auth')
          }}
          onSignIn={() => {
            setError(null)
            setAuthMode('signin')
            setScreen('auth')
          }}
        />
      )
    }
    return (
      <AuthPage
        mode={authMode}
        onModeChange={(m) => {
          setError(null)
          setAuthMode(m)
        }}
        onSignIn={signIn}
        onSignUp={signUp}
        loading={loading}
        error={error}
        onClearError={() => setError(null)}
        onBack={() => setScreen('landing')}
        invitePending={Boolean(inviteToken)}
      />
    )
  }
  if (inviteToken) {
    return <InviteAcceptancePage token={inviteToken} onContinue={finishInvite} />
  }
  return <DashboardPage user={user} onSignOut={signOut} />
}
