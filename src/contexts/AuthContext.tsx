'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth, isConfigured } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, displayName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isConfigured) {
      // Firebase not configured, user remains null
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string) => {
    if (!isConfigured) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signup = async (email: string, password: string, displayName?: string) => {
    if (!isConfigured) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials.')
    }
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    
    if (displayName && user) {
      await updateProfile(user, {
        displayName: displayName
      })
    }
  }

  const logout = async () => {
    if (!isConfigured) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials.')
    }
    await signOut(auth)
  }

  const resetPassword = async (email: string) => {
    if (!isConfigured) {
      throw new Error('Firebase is not configured. Please set up your Firebase credentials.')
    }
    await sendPasswordResetEmail(auth, email)
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}