"use client"
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Map NextAuth error codes/messages to user-friendly text
  function getFriendlyErrorMessage(err: string | undefined | null): string {
    if (!err) return 'Login failed. Please try again.';
    if (err.toLowerCase().includes('deactivat')) {
      return 'Your account has been deactivated. Please contact support if you believe this is a mistake.';
    }
    if (err === 'CredentialsSignin') return 'Incorrect email or password. Please try again.';
    if (err.toLowerCase().includes('network')) return 'Network error. Please try again.';
    return 'Login failed. ' + err;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await signIn('credentials', { email, password, redirect: false })
    if (res?.ok) router.push('/')
    else setError(getFriendlyErrorMessage(res?.error))
  }

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input className="mt-1 w-full border rounded p-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Password</label>
          <input className="mt-1 w-full border rounded p-2" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded">Sign in</button>
      </form>
      <div className="text-sm mt-4 flex justify-between">
        <a className="text-indigo-600" href="/forgot-password">Forgot password?</a>
        <span>
          No account? <a className="text-indigo-600" href="/register">Register</a>
        </span>
      </div>
    </div>
  )
}
