import { useState } from 'react'
import { Plus, UsersRound, ContactRound, X, FolderPlus } from 'lucide-react'
import { AppSidebar } from '../components/layout/AppSidebar'
import { Topbar } from '../components/layout/Topbar'
import { BalanceSummary } from '../components/dashboard/BalanceSummary'
import { DebtSimplificationCard } from '../components/dashboard/DebtSimplificationCard'
import { ExpenseList } from '../components/expenses/ExpenseList'
import { AddExpenseModal } from '../components/expenses/AddExpenseModal'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { useExpenses } from '../hooks/useExpenses'

function CreateGroupModal({ onClose, onSubmit }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({ name: name.trim(), description: description.trim() })
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create group')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173023]/35 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#21372a]">Create a group</h2>
            <p className="text-xs text-[#8a978d]">Organize expenses with trips or housemates.</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-[#849188] hover:bg-[#f2f5f1]">
            <X size={18} />
          </button>
        </div>
        {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Group name</span>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paris Trip, Roommates"
              className="w-full rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 py-3 text-sm outline-none focus:border-[#5a9a6b]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#66766c]">Description (optional)</span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Summer vacation expenses"
              className="w-full rounded-xl border border-[#dfe8df] bg-[#fbfcfa] px-3.5 py-3 text-sm outline-none focus:border-[#5a9a6b]"
            />
          </label>
          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create group'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EmptyView({ type, onAdd, onAddGroup }) {
  const configs = {
    groups: {
      title: 'No groups yet',
      copy: 'Create your first group to share trips, house costs, or projects.',
      icon: UsersRound,
      btnText: 'Create a group',
      action: onAddGroup,
    },
    friends: {
      title: 'No friends added yet',
      copy: 'Users who register on the app can be split with directly or added to groups.',
      icon: ContactRound,
      btnText: 'Add expense',
      action: onAdd,
    },
  }
  const config = configs[type] || configs.friends
  return (
    <div className="fade-up rounded-2xl border border-[#e3eae2] bg-white p-8 text-center shadow-[0_4px_20px_rgba(38,59,45,.04)]">
      <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#eaf4eb] text-[#398451]">
        <config.icon size={22} />
      </div>
      <h2 className="text-xl font-bold text-[#25382b]">{config.title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#859189]">{config.copy}</p>
      <Button onClick={config.action} className="mt-6">
        <Plus size={16} /> {config.btnText}
      </Button>
    </div>
  )
}

export function DashboardPage({ user, onSignOut }) {
  const [activeView, setActiveView] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [groupModalOpen, setGroupModalOpen] = useState(false)

  const {
    expenses,
    groups,
    users,
    balances,
    addExpense,
    addGroup,
    transfers,
    owed,
    owe,
    total,
  } = useExpenses(user)

  const title =
    activeView === 'dashboard'
      ? `Good morning, ${(user.name || user.username || 'User').split(' ')[0]}`
      : activeView === 'expenses'
      ? 'All expenses'
      : activeView === 'groups'
      ? 'Groups'
      : 'Friends'

  const visibleExpenses = activeView === 'expenses' ? expenses : expenses.slice(0, 4)

  // Calculate friends with active balances
  const otherUsers = (users || []).filter((u) => u.id !== user.id)

  return (
    <div className="app-surface flex min-h-screen text-[#202b24]">
      <AppSidebar
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onSignOut={onSignOut}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        expensesCount={expenses.length}
      />

      {sidebarOpen && (
        <button
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-[#1c3425]/20 lg:hidden"
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={title}
          onAdd={() => setModalOpen(true)}
          onMenu={() => setSidebarOpen(true)}
          user={user}
        />

        <main className="mx-auto w-full max-w-[1360px] flex-1 p-5 lg:p-9">
          {activeView === 'dashboard' ? (
            <div className="fade-up space-y-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm text-[#7e8d82]">
                    Here’s your shared spending at a glance.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setGroupModalOpen(true)}>
                    <FolderPlus size={16} /> New group
                  </Button>
                  <Button onClick={() => setModalOpen(true)}>
                    <Plus size={16} /> Add expense
                  </Button>
                </div>
              </div>

              <BalanceSummary total={total} owe={owe} owed={owed} />

              <div className="grid gap-6 xl:grid-cols-[1.4fr_.8fr]">
                <ExpenseList expenses={visibleExpenses} currentUser={user} />

                <div className="space-y-6">
                  <DebtSimplificationCard
                    transfers={transfers}
                    users={users}
                    currentUser={user}
                  />

                  <section className="rounded-2xl border border-[#e3eae2] bg-white p-5 shadow-[0_4px_20px_rgba(38,59,45,.04)]">
                    <div className="mb-5 flex items-center justify-between">
                      <div>
                        <h2 className="font-bold text-[#25382b]">Your people</h2>
                        <p className="mt-1 text-xs text-[#8a978d]">
                          {otherUsers.length > 0 ? `${otherUsers.length} members registered` : 'No members yet'}
                        </p>
                      </div>
                      {otherUsers.length > 0 && (
                        <button
                          onClick={() => setActiveView('friends')}
                          className="text-xs font-bold text-[#398451]"
                        >
                          View all
                        </button>
                      )}
                    </div>

                    {otherUsers.length > 0 ? (
                      <div className="space-y-3">
                        {otherUsers.slice(0, 4).map((person) => {
                          const pBalance = balances[String(person.id)] || 0
                          const isOwed = pBalance < 0
                          const owesYou = pBalance > 0
                          const initials = (person.username || person.email || 'U')
                            .slice(0, 2)
                            .toUpperCase()

                          return (
                            <div className="flex items-center gap-3" key={person.id}>
                              <Avatar initials={initials} color="#f2b77d" />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-[#344439]">
                                  {person.username || person.email}
                                </p>
                                <p className="text-xs text-[#8b978e]">
                                  {owesYou
                                    ? 'Owes you'
                                    : isOwed
                                    ? 'You owe'
                                    : 'Settled up'}
                                </p>
                              </div>
                              <p
                                className={`text-sm font-bold ${
                                  isOwed
                                    ? 'text-[#c3702f]'
                                    : owesYou
                                    ? 'text-[#3b8b55]'
                                    : 'text-[#8b978e]'
                                }`}
                              >
                                {owesYou
                                  ? `+$${Math.abs(pBalance).toFixed(2)}`
                                  : isOwed
                                  ? `-$${Math.abs(pBalance).toFixed(2)}`
                                  : '$0.00'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="py-4 text-center text-xs text-[#8b978e]">
                        No other users found yet. Invite friends or create an expense to begin!
                      </p>
                    )}
                  </section>
                </div>
              </div>
            </div>
          ) : activeView === 'expenses' ? (
            <div className="fade-up max-w-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#21372a]">All expenses</h1>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add expense
                </Button>
              </div>
              <ExpenseList
                expenses={visibleExpenses}
                title="All expenses"
                currentUser={user}
              />
            </div>
          ) : activeView === 'groups' ? (
            <div className="max-w-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#21372a]">Your groups</h1>
                <Button onClick={() => setGroupModalOpen(true)}>
                  <Plus size={16} /> Create group
                </Button>
              </div>
              {groups.length === 0 ? (
                <EmptyView
                  type="groups"
                  onAdd={() => setModalOpen(true)}
                  onAddGroup={() => setGroupModalOpen(true)}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className="rounded-2xl border border-[#e3eae2] bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5ee] text-[#398451]">
                          <UsersRound size={18} />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-[#304336]">{group.name}</p>
                          <p className="text-xs text-[#8a978d]">
                            {group.description || 'No description'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-3xl space-y-4">
              <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-[#21372a]">Registered friends</h1>
                <Button onClick={() => setModalOpen(true)}>
                  <Plus size={16} /> Add expense
                </Button>
              </div>
              {otherUsers.length === 0 ? (
                <EmptyView
                  type="friends"
                  onAdd={() => setModalOpen(true)}
                  onAddGroup={() => setGroupModalOpen(true)}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {otherUsers.map((person) => {
                    const initials = (person.username || person.email || 'U')
                      .slice(0, 2)
                      .toUpperCase()
                    return (
                      <div
                        key={person.id}
                        className="flex items-center gap-3 rounded-2xl border border-[#e3eae2] bg-white p-4 shadow-sm"
                      >
                        <Avatar initials={initials} color="#f2b77d" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-[#304336]">
                            {person.username || person.email}
                          </p>
                          <p className="text-xs text-[#8a978d]">{person.email}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {modalOpen && (
            <AddExpenseModal
              onClose={() => setModalOpen(false)}
              onSubmit={addExpense}
              groups={groups}
              users={users}
              currentUser={user}
            />
          )}

          {groupModalOpen && (
            <CreateGroupModal
              onClose={() => setGroupModalOpen(false)}
              onSubmit={addGroup}
            />
          )}
        </main>
      </div>
    </div>
  )
}
