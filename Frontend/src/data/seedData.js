export const currentUser = { id: 'you', name: 'Muna', email: 'muna@example.com', initials: 'MN' }
export const people = [
  { id: 'alex', name: 'Alex Morgan', initials: 'AM', color: '#f2b77d' },
  { id: 'sam', name: 'Sam Rivera', initials: 'SR', color: '#9cc5d9' },
  { id: 'jamie', name: 'Jamie Lee', initials: 'JL', color: '#c8b0df' },
  { id: 'taylor', name: 'Taylor Kim', initials: 'TK', color: '#a8d2b2' },
]
export const groups = [
  { id: 'weekend', name: 'Lisbon weekend', members: ['you', 'alex', 'sam', 'jamie'] },
  { id: 'apartment', name: 'Apartment', members: ['you', 'alex'] },
  { id: 'team', name: 'Design team', members: ['you', 'sam', 'taylor'] },
]
export const categories = [
  { id: 'food', label: 'Food', icon: 'utensils', color: '#f97316', bg: '#fff1e7' },
  { id: 'travel', label: 'Travel', icon: 'plane', color: '#4f79d9', bg: '#edf2ff' },
  { id: 'rent', label: 'Rent', icon: 'house', color: '#9d66c5', bg: '#f5edfb' },
  { id: 'entertainment', label: 'Fun', icon: 'party', color: '#d29b32', bg: '#fff7dd' },
]
export const seedExpenses = [
  { id: 'e1', description: 'Dinner at A Cevicheria', amount: 86.40, category: 'food', paidBy: 'you', participants: ['you','alex','sam','jamie'], split: 'equal', date: 'Today', group: 'Lisbon weekend' },
  { id: 'e2', description: 'Uber to the airport', amount: 32.00, category: 'travel', paidBy: 'alex', participants: ['you','alex'], split: 'equal', date: 'Yesterday', group: 'Lisbon weekend' },
  { id: 'e3', description: 'Monthly apartment rent', amount: 1240.00, category: 'rent', paidBy: 'you', participants: ['you','alex'], split: 'equal', date: 'Sep 01', group: 'Apartment' },
  { id: 'e4', description: 'Cinema & snacks', amount: 48.00, category: 'entertainment', paidBy: 'sam', participants: ['you','sam','taylor'], split: 'equal', date: 'Aug 30', group: 'Design team' },
]
