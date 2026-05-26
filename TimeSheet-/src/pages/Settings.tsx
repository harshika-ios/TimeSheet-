import { useState } from 'react'
import { User, Building2, LogOut, Trash2, Save, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Settings() {
  const { user, signOut } = useAuth()
  const { currentWorkspace, refreshWorkspaces } = useWorkspace()
  const navigate = useNavigate()

  const [profileData, setProfileData] = useState({
    fullName: user?.user_metadata?.full_name || '',
    email: user?.email || '',
  })
  const [workspaceData, setWorkspaceData] = useState({
    name: currentWorkspace?.name || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: profileData.fullName }
      })

      if (updateError) throw updateError

      setSuccess('Profile updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentWorkspace) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await (supabase
        .from('workspaces') as any)
        .update({ name: workspaceData.name })
        .eq('id', currentWorkspace.id)

      if (updateError) throw updateError

      await refreshWorkspaces()
      setSuccess('Workspace updated successfully!')
    } catch (err: any) {
      setError(err.message || 'Failed to update workspace')
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    if (window.confirm('Are you sure you want to sign out?')) {
      await signOut()
      navigate('/login')
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('⚠️ WARNING: This will permanently delete your account and ALL your data.\n\nThis includes:\n• All workspaces\n• All clients\n• All projects\n• All time entries\n\nThis action CANNOT be undone!\n\nType "DELETE" to confirm.')) {
      return
    }

    const confirmation = prompt('Type DELETE to confirm account deletion:')
    if (confirmation !== 'DELETE') {
      alert('Account deletion cancelled.')
      return
    }

    setSaving(true)
    setError('')

    try {
      // Delete user account (this will cascade delete all related data)
      const { error: deleteError } = await supabase.rpc('delete_user')

      if (deleteError) throw deleteError

      await signOut()
      navigate('/login')
    } catch (err: any) {
      setError(err.message || 'Failed to delete account')
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account and preferences
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg bg-error-50 border border-error-200 p-4">
          <AlertCircle className="h-5 w-5 text-error-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-success-50 border border-success-200 p-4">
          <p className="text-sm text-success-700">{success}</p>
        </div>
      )}

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Profile</h2>
            <p className="text-sm text-neutral-500">Manage your personal information</p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={profileData.fullName}
              onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
              placeholder="Your name"
              className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 px-4 text-sm text-neutral-500 cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Email cannot be changed at this time
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Workspace Settings */}
      {currentWorkspace && (
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
              <Building2 className="h-5 w-5 text-success-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Workspace</h2>
              <p className="text-sm text-neutral-500">Manage current workspace settings</p>
            </div>
          </div>

          <form onSubmit={handleUpdateWorkspace} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                value={workspaceData.name}
                onChange={(e) => setWorkspaceData({ ...workspaceData, name: e.target.value })}
                required
                minLength={2}
                placeholder="My Workspace"
                className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 px-4 text-sm transition-colors focus:border-primary-300 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Workspace ID
              </label>
              <input
                type="text"
                value={currentWorkspace.id}
                disabled
                className="w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2.5 px-4 text-sm text-neutral-500 cursor-not-allowed font-mono text-xs"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="btn bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Account Actions */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
            <User className="h-5 w-5 text-neutral-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Account</h2>
            <p className="text-sm text-neutral-500">Manage your account actions</p>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSignOut}
            className="btn w-full justify-center border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-error-200 bg-error-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-error-100">
            <Trash2 className="h-5 w-5 text-error-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-error-900">Danger Zone</h2>
            <p className="text-sm text-error-700">Irreversible actions</p>
          </div>
        </div>

        <div className="rounded-lg bg-white border border-error-200 p-4">
          <h3 className="text-sm font-semibold text-neutral-900 mb-2">
            Delete Account
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button
            onClick={handleDeleteAccount}
            disabled={saving}
            className="btn bg-error-500 text-white hover:bg-error-600 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete Account
          </button>
        </div>
      </div>

      {/* App Info */}
      <div className="card bg-neutral-50">
        <div className="text-center py-4">
          <p className="text-sm text-neutral-600 mb-1">Timesheet App</p>
          <p className="text-xs text-neutral-500">
            Built with React, TypeScript, and Supabase
          </p>
          <p className="text-xs text-neutral-400 mt-2">
            Version 1.0.0
          </p>
        </div>
      </div>
    </div>
  )
}
