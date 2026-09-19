import { useState } from 'react'
import { AuthPage } from './pages/AuthPage'
import { LandingPage } from './pages/LandingPage'
import { DashboardPage } from './pages/DashboardPage'
import { useAuth } from './hooks/useAuth'
import './App.css'

export default function App() {
  const { user, signIn, signUp, signOut } = useAuth()
  const [authMode, setAuthMode] = useState('signin')
  const [screen, setScreen] = useState('landing')

  if (!user) {
    if (screen === 'landing') return <LandingPage onGetStarted={() => { setAuthMode('signup'); setScreen('auth') }} onSignIn={() => { setAuthMode('signin'); setScreen('auth') }} />
    return <AuthPage mode={authMode} onModeChange={setAuthMode} onSignIn={signIn} onSignUp={signUp} onBack={() => setScreen('landing')} />
  }
  return <DashboardPage user={user} onSignOut={signOut} />
}
