'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface SignupFormProps {
  onToggleMode: () => void
  onSuccess?: () => void
}

export default function SignupForm({ onToggleMode, onSuccess }: SignupFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name || !email || !password || !confirmPassword) {
      console.error('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      console.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      console.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await signup(email, password, name)
      console.log('Account created successfully!')
      onSuccess?.()
    } catch (error: any) {
      console.error('Signup error:', error)
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/email-already-in-use':
          console.error('An account with this email already exists')
          break
        case 'auth/invalid-email':
          console.error('Invalid email address')
          break
        case 'auth/weak-password':
          console.error('Password is too weak')
          break
        default:
          console.error('Account creation failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
          placeholder="Enter your full name"
          disabled={loading}
        />
      </div>

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
          placeholder="Choose a password (min. 6 characters)"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-400"
          placeholder="Confirm your password"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-medium transition-colors"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={onToggleMode}
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          Already have an account? Sign in
        </button>
      </div>
    </form>
  )
}