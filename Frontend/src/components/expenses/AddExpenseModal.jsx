import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { categories } from '../../data/seedData'

export function AddExpenseModal({ onClose, onSubmit, groups = [], users = [], currentUser }) {
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'food',
    groupId: groups.length > 0 ? String(groups[0].id) : '',
    split: 'equal',
  })
  const [selectedUserIds, setSelectedUserIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const update = (key, value) => {
    setError(null)
    setForm((old) => ({ ...old, [key]: value }))
  }

  const toggleUserSelection = (id) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (!form.description || !form.amount || Number(form.amount) <= 0) {
      setError('Please provide a valid description and amount.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const selectedGroupId = form.groupId ? Number(form.groupId) : null
      let splits = null

      if (!selectedGroupId && selectedUserIds.length > 0) {
        // Splitting personal expense with specific registered users + self
        const allParticipants = Array.from(new Set([currentUser?.id, ...selectedUserIds])).filter(Boolean)
        splits = allParticipants.map((uid) => ({ user_id: uid }))
      }

      const payload = {
        group_id: selectedGroupId,
        amount: Number(form.amount),
        description: form.description,
        category: form.category,
        split_type: form.split,
        splits: splits,
      }

      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save expense.')
    } finally {
      setSubmitting(false)
    }
  }

  const otherUsers = (users || []).filter((u) => u.id !== currentUser?.id)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#173023]/35 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="modal-in max-h-[94vh] w-full overflow-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-[560px] sm:rounded-3xl sm:p-7">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[.16em] text-[#59916b]">
              New transaction
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#21372a]">Add an expense</h2>
            <p className="mt-1 text-sm text-[#89968d]">Written directly to your backend database.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#849188] hover:bg-[#f2f5f1]">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
              What was it for?
            </span>
            <input
              autoFocus
              required
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="e.g. Dinner, Groceries, Flight"
              className="w-full rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 py-3 text-sm outline-none transition focus:border-[#5a9a6b] focus:ring-2 focus:ring-[#dceede]"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
                Amount
              </span>
              <div className="flex items-center rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 focus-within:border-[#5a9a6b]">
                <span className="text-[#91a096]">$</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-transparent px-2 py-3 text-sm outline-none"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
                Group
              </span>
              <select
                value={form.groupId}
                onChange={(e) => update('groupId', e.target.value)}
                className="w-full rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 py-3 text-sm outline-none focus:border-[#5a9a6b]"
              >
                <option value="">Personal / No Group</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!form.groupId && otherUsers.length > 0 && (
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
                Split with friends
              </span>
              <div className="flex flex-wrap gap-2">
                {otherUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id)
                  return (
                    <button
                      type="button"
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        isSelected
                          ? 'bg-[#1d5b3a] text-white'
                          : 'border border-[#dce5dc] bg-white text-[#526359] hover:bg-[#f5f8f4]'
                      }`}
                    >
                      {isSelected && <Check size={12} className="mr-1 inline" />}
                      {u.username || u.email}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
              Category
            </span>
            <div className="grid grid-cols-4 gap-2">
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => update('category', category.id)}
                  className={`rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition ${
                    form.category === category.id
                      ? 'border-[#75a57e] bg-[#eef8ef] text-[#28643b]'
                      : 'border-[#e5ebe4] text-[#77857b] hover:bg-[#f7faf6]'
                  }`}
                >
                  <span className="mb-1 block text-base">
                    {category.id === 'food'
                      ? '🍽️'
                      : category.id === 'travel'
                      ? '✈️'
                      : category.id === 'rent'
                      ? '⌂'
                      : '🎟️'}
                  </span>
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#718076]">
              Split type
            </span>
            <div className="flex flex-wrap gap-2">
              {['equal', 'exact', 'percentage'].map((split) => (
                <button
                  type="button"
                  key={split}
                  onClick={() => update('split', split)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold capitalize transition ${
                    form.split === split
                      ? 'bg-[#1d5b3a] text-white'
                      : 'bg-[#f0f4ef] text-[#708076]'
                  }`}
                >
                  {form.split === split && <Check size={13} className="mr-1 inline" />}
                  {split === 'equal' ? 'Equally' : split === 'exact' ? 'Exactly' : 'Percentages'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#edf1ec] pt-5">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </span>
              ) : (
                'Save expense'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
