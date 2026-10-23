import { useEffect, useMemo, useState, useCallback } from 'react'
import * as expenseService from '../services/expenseService'
import { calculateBalances, simplifyDebts } from '../services/debtSimplificationService'

export function useExpenses(user) {
  const [expenses, setExpenses] = useState([])
  const [groups, setGroups] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadData = useCallback(async () => {
    if (!user || !user.id) return
    setLoading(true)
    setError(null)
    try {
      const [fetchedExpenses, fetchedGroups, fetchedUsers] = await Promise.all([
        expenseService.getExpenses().catch((err) => {
          console.warn('Could not fetch expenses:', err)
          return []
        }),
        expenseService.getGroups().catch((err) => {
          console.warn('Could not fetch groups:', err)
          return []
        }),
        expenseService.getUsers().catch((err) => {
          console.warn('Could not fetch users:', err)
          return []
        }),
      ])
      setExpenses(fetchedExpenses || [])
      setGroups(fetchedGroups || [])
      setUsers(fetchedUsers || [])
    } catch (err) {
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addExpense = async (expensePayload) => {
    try {
      const created = await expenseService.createExpense(expensePayload)
      setExpenses((prev) => [created, ...prev])
      return { success: true, expense: created }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create expense'
      console.error('Error adding expense:', msg)
      throw new Error(msg)
    }
  }

  const addGroup = async (groupPayload) => {
    try {
      const created = await expenseService.createGroup(groupPayload)
      setGroups((prev) => [...prev, created])
      return { success: true, group: created }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create group'
      console.error('Error creating group:', msg)
      throw new Error(msg)
    }
  }

  const balances = useMemo(() => calculateBalances(expenses), [expenses])
  const transfers = useMemo(() => simplifyDebts(balances), [balances])

  const myId = String(user?.id || 'you')
  const userBalance = balances[myId] !== undefined ? balances[myId] : 0
  const owed = Math.max(0, userBalance)
  const owe = Math.max(0, -userBalance)

  return {
    expenses,
    groups,
    users,
    loading,
    error,
    addExpense,
    addGroup,
    loadData,
    balances,
    transfers,
    owed,
    owe,
    total: owed - owe,
  }
}
