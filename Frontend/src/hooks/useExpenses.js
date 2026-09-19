import { useMemo, useState } from 'react'
import { seedExpenses } from '../data/seedData'
import { calculateBalances, simplifyDebts } from '../services/debtSimplificationService'

export function useExpenses() {
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem('splitwise_expenses') || 'null') || seedExpenses)
  const addExpense = (expense) => { const next = [{ ...expense, id: crypto.randomUUID?.() || String(Date.now()) }, ...expenses]; setExpenses(next); localStorage.setItem('splitwise_expenses', JSON.stringify(next)) }
  const balances = useMemo(() => calculateBalances(expenses), [expenses])
  const transfers = useMemo(() => simplifyDebts(balances), [balances])
  const owed = Math.max(0, balances.you)
  const owe = Math.max(0, -balances.you)
  return { expenses, addExpense, balances, transfers, owed, owe, total: owed - owe }
}
