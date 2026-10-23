import { useState, useEffect } from 'react'
import * as authService from '../services/authService'

function getInitials(name) {
  if (!name) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.slice(0, 2).toUpperCase()
}

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('splitwise_user') || 'null')
    } catch {
      return null
    }
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token && !user) {
      authService.getMe()
        .then((userData) => {
          const formatted = {
            id: userData.id,
            name: userData.username,
            username: userData.username,
            email: userData.email,
            initials: getInitials(userData.username),
          }
          localStorage.setItem('splitwise_user', JSON.stringify(formatted))
          setUser(formatted)
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('splitwise_user')
          setUser(null)
        })
    }
  }, [])

  const signIn = async ({ email, password }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await authService.login(email, password)
      if (data.access_token) {
        localStorage.setItem('token', data.access_token)
      }
      const userData = data.user || { email, username: email.split('@')[0] }
      const formatted = {
        id: userData.id,
        name: userData.username,
        username: userData.username,
        email: userData.email,
        initials: getInitials(userData.username),
      }
      localStorage.setItem('splitwise_user', JSON.stringify(formatted))
      setUser(formatted)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to sign in. Please check your credentials.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async ({ name, email, password }) => {
    setLoading(true)
    setError(null)
    try {
      await authService.signup(name, email, password)
      // Auto login after sign up
      const data = await authService.login(email, password)
      if (data.access_token) {
        localStorage.setItem('token', data.access_token)
      }
      const userData = data.user || { email, username: name }
      const formatted = {
        id: userData.id,
        name: userData.username,
        username: userData.username,
        email: userData.email,
        initials: getInitials(userData.username),
      }
      localStorage.setItem('splitwise_user', JSON.stringify(formatted))
      setUser(formatted)
      return { success: true }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create account. Please try again.'
      setError(msg)
      return { success: false, error: msg }
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await authService.logout()
    localStorage.removeItem('token')
    localStorage.removeItem('splitwise_user')
    localStorage.removeItem('splitwise_expenses')
    setUser(null)
  }

  return { user, loading, error, signIn, signUp, signOut, setError }
}
