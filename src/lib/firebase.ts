import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'
import { getStorage, FirebaseStorage } from 'firebase/storage'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'demo-app-id'
}

// Check if Firebase is properly configured
const isConfigured = process.env.NEXT_PUBLIC_FIREBASE_API_KEY && 
                    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

if (typeof window !== 'undefined' && isConfigured) {
  // Initialize Firebase only on client side and when properly configured
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
} else {
  // Create placeholder objects for server-side rendering or missing config
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
  storage = {} as FirebaseStorage
}

export { auth, db, storage, isConfigured }
export default app