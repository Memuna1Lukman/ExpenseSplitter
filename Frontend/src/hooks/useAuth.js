import { useState } from 'react'
import { currentUser } from '../data/seedData'

export function useAuth() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('splitwise_user') || 'null'))
  const signIn = ({ email }) => { const next = { ...currentUser, email }; localStorage.setItem('splitwise_user', JSON.stringify(next)); setUser(next) }
  const signUp = ({ name, email }) => { const next = { ...currentUser, name: name || currentUser.name, initials: (name || currentUser.name).split(' ').map((part) => part[0]).join('').slice(0,2).toUpperCase(), email }; localStorage.setItem('splitwise_user', JSON.stringify(next)); setUser(next) }
  const signOut = () => { localStorage.removeItem('splitwise_user'); setUser(null) }
  return { user, signIn, signUp, signOut }
}
