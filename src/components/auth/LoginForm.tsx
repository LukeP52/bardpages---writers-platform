'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface LoginFormProps {
  onToggleMode: () => void
  onSuccess?: () => void
}

export default function LoginForm({ onToggleMode, onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)

    try {
      await login(email, password)
      toast.success('Welcome back!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email')
          break
        case 'auth/wrong-password':
          toast.error('Incorrect password')
          break
        case 'auth/invalid-email':
          toast.error('Invalid email address')
          break
        case 'auth/too-many-requests':
          toast.error('Too many failed attempts. Please try again later.')
          break
        default:
          toast.error('Login failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
          placeholder="Enter your email"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
          placeholder="Enter your password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Don't have an account? Sign up
        </button>
      </div>
    </form>
  )
}