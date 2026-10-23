import { useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { useAuth } from './hooks/useAuth'
import './App.css'

export default function App() {
  const { user, loading, error, signIn, signUp, signOut, setError } = useAuth()
  const [authMode, setAuthMode] = useState('signin')
  const [screen, setScreen] = useState('landing')

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
      />
    )
  }
  return <DashboardPage user={user} onSignOut={signOut} />
}
