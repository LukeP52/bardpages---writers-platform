# Firebase Setup Guide

This guide will help you set up Firebase authentication and database for your BardPages application.

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "bardpages-app")
4. Choose your analytics preferences
5. Click "Create project"

## Step 2: Set up Authentication

1. In the Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable **Email/Password** authentication
3. Optionally, enable other sign-in providers (Google, GitHub, etc.)

## Step 3: Set up Firestore Database

1. Go to **Firestore Database**
2. Click "Create database"
3. Choose **Start in test mode** (you can secure it later)
4. Select your preferred location
5. Click "Done"

## Step 4: Set up Storage (Optional)

1. Go to **Storage**
2. Click "Get started"
3. Accept the default security rules for now
4. Choose the same location as your Firestore database

## Step 5: Get Your Firebase Configuration

1. In the Firebase Console, click the gear icon ⚙️ and select **Project settings**
2. Scroll down to "Your apps" and click the web icon `</>`
3. Register your app with a name (e.g., "BardPages Web")
4. Copy the configuration object

## Step 6: Configure Your App

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your Firebase configuration in `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id_here
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here
   ```

## Step 7: Set up Security Rules (Recommended)

### Firestore Rules
Go to **Firestore Database** > **Rules** and update with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User's excerpts, storyboards, books, etc.
    match /users/{userId}/excerpts/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/storyboards/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/books/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /users/{userId}/categories/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules
Go to **Storage** > **Rules** and update with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 8: Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to your app
3. Try creating an account and signing in
4. Check the Firebase Console to see user accounts and data

## Current Features

✅ **Implemented:**
- User authentication (signup/login/logout)
- Protected routes
- User menu in navigation
- Error handling for auth operations

🔄 **Next Phase:**
- Replace local storage with Firestore
- User-specific data storage
- File uploads to Firebase Storage

## Troubleshooting

**Build errors about Firebase:**
- Make sure your `.env.local` file is properly configured
- If testing without Firebase, the app will work with local storage only

**Authentication not working:**
- Check that Email/Password is enabled in Firebase Console
- Verify all environment variables are correct
- Check browser console for detailed error messages

**Need help?**
- Check the [Firebase Documentation](https://firebase.google.com/docs)
- Review the Firebase Console for any configuration issues