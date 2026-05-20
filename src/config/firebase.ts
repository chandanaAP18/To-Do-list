import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Replace these placeholders with your actual Firebase project settings
const firebaseConfig = {
  apiKey: "MOCK_API_KEY_NEUROBOARD",
  authDomain: "neuroboard-app.firebaseapp.com",
  projectId: "neuroboard-app",
  storageBucket: "neuroboard-app.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};

let app;
let db: any;
let auth: any;
let isUsingMock = true;

try {
  // If the user replaces with a real API key, initialize actual Firebase
  if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("MOCK_")) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    
    // Set up persistent cache for Firestore (Offline capability)
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });

    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
    isUsingMock = false;
    console.log("Firebase initialized successfully in production mode.");
  }
} catch (error) {
  console.warn("Firebase initialization failed, falling back to local mock mode:", error);
}

// Simple local mock fallback for Firestore database if Firebase is not configured
class MockFirestore {
  private async getStore(collectionName: string): Promise<any[]> {
    const data = await AsyncStorage.getItem(`@neuroboard_col_${collectionName}`);
    return data ? JSON.parse(data) : [];
  }

  private async saveStore(collectionName: string, data: any[]): Promise<void> {
    await AsyncStorage.setItem(`@neuroboard_col_${collectionName}`, JSON.stringify(data));
  }

  async getDocs(collectionName: string, queryFn?: (items: any[]) => any[]) {
    let items = await this.getStore(collectionName);
    if (queryFn) items = queryFn(items);
    return {
      docs: items.map(item => ({
        id: item.id,
        data: () => item
      }))
    };
  }

  async addDoc(collectionName: string, data: any) {
    const items = await this.getStore(collectionName);
    const newDoc = { ...data, id: Math.random().toString(36).substring(2, 9), createdAt: new Date().toISOString() };
    items.push(newDoc);
    await this.saveStore(collectionName, items);
    return { id: newDoc.id };
  }

  async updateDoc(collectionName: string, docId: string, data: any) {
    let items = await this.getStore(collectionName);
    items = items.map(item => item.id === docId ? { ...item, ...data, updatedAt: new Date().toISOString() } : item);
    await this.saveStore(collectionName, items);
  }

  async deleteDoc(collectionName: string, docId: string) {
    let items = await this.getStore(collectionName);
    items = items.filter(item => item.id !== docId);
    await this.saveStore(collectionName, items);
  }
}

// Simple mock for Authentication
class MockAuth {
  private currentUser: any = null;

  async signInWithEmailAndPassword(email: string, pass: string) {
    const user = { uid: "mock-user-123", email, displayName: email.split('@')[0], photoURL: "https://api.dicebear.com/7.x/bottts/svg?seed=neuro" };
    await AsyncStorage.setItem("@neuroboard_user", JSON.stringify(user));
    this.currentUser = user;
    return { user };
  }

  async signInWithGoogle() {
    const user = { uid: "mock-google-123", email: "googleuser@example.com", displayName: "Google User", photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=google" };
    await AsyncStorage.setItem("@neuroboard_user", JSON.stringify(user));
    this.currentUser = user;
    return { user };
  }

  async signOut() {
    await AsyncStorage.removeItem("@neuroboard_user");
    this.currentUser = null;
  }

  async checkAuthState(onStateChanged: (user: any) => void) {
    const stored = await AsyncStorage.getItem("@neuroboard_user");
    if (stored) {
      this.currentUser = JSON.parse(stored);
    }
    onStateChanged(this.currentUser);
  }

  getCurrentUser() {
    return this.currentUser;
  }
}

export const mockDb = new MockFirestore();
export const mockAuth = new MockAuth();

export { db, auth, isUsingMock };
