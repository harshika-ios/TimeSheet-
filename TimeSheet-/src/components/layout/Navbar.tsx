import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleSettings = () => {
    setShowDropdown(false)
    navigate('/settings')
  }

  // Get user's initials for avatar
  const getInitials = (name: string | undefined) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  return (
    <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-6 shadow-sm">
      {/* Search Bar */}
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-4 text-sm transition-colors focus:border-primary-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100"
          />
        </div>
      </div>

      {/* Right Side - User Menu */}
      <div className="flex items-center gap-3">
        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-neutral-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
              {getInitials(userDisplayName)}
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-neutral-900">{userDisplayName}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-neutral-200 bg-white shadow-lg z-20">
                <div className="p-2">
                  <button
                    onClick={handleSettings}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    <Settings className="h-4 w-4" />
                    Account Settings
                  </button>
                  <hr className="my-2 border-neutral-100" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-error-600 transition-colors hover:bg-error-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
