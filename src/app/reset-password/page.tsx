"use client"
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto p-6">Loading…</div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset token')
    }
  }, [token, email])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, newPassword })
      })
      const data = await res.json()
      if (!res.ok) setError(data.error || 'Failed to reset password')
      else {
        setMessage('Password updated. You can now sign in.')
        setNewPassword('')
        setConfirmPassword('')
        setTimeout(() => router.push('/login'), 1500)
      }
    } catch (e) {
      setError('Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">New password</label>
          <input className="mt-1 w-full border rounded p-2" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Confirm new password</label>
          <input className="mt-1 w-full border rounded p-2" type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required />
        </div>
        {error && (
          <p className="text-sm text-red-600">
            {error} {error?.toLowerCase().includes('token') && (
              <a href="/forgot-password" className="text-indigo-600 underline">Request a new link</a>
            )}
          </p>
        )}
        {message && <p className="text-sm text-green-700">{message}</p>}
        <button disabled={loading || !token} type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">
          {loading ? 'Resetting...' : 'Reset password'}
        </button>
      </form>
    </div>
  )
}
