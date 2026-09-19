const STORAGE_KEY = 'splitwise_expenses'
export const getLocalExpenses = () => JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
export const saveLocalExpense = (expense) => { const expenses = [expense, ...getLocalExpenses()]; localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses)); return expense }
