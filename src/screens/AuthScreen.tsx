import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LogIn, UserPlus, ShieldAlert, Cloud, CloudOff, Check } from 'lucide-react-native';
import { mockAuth, isUsingMock } from '../config/firebase';
import GlassCard from '../components/GlassCard';

interface AuthScreenProps {
  onAuthSuccess: (user: any) => void;
  currentUser: any;
  onLogout: () => void;
  dark?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, currentUser, onLogout, dark = false }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    mockAuth.checkAuthState((user) => {
      if (user) {
        onAuthSuccess(user);
      }
    });
  }, []);

  const handleAuth = async () => {
    if (!email || !password) {
      setErrorMsg("Please fill in all credentials.");
      return;
    }
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegister) {
        // Registration Mock
        await new Promise(resolve => setTimeout(resolve, 800));
        const res = await mockAuth.signInWithEmailAndPassword(email, password);
        onAuthSuccess(res.user);
      } else {
        const res = await mockAuth.signInWithEmailAndPassword(email, password);
        onAuthSuccess(res.user);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Failed to authenticate.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      const res = await mockAuth.signInWithGoogle();
      onAuthSuccess(res.user);
    } catch (e: any) {
      setErrorMsg("Google Sign-In failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerCloudSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1500);
  };

  if (currentUser) {
    return (
      <View style={styles.profileContainer}>
        <GlassCard dark={dark} style={styles.profileCard}>
          <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>Your Profile</Text>
          
          <View style={styles.avatarRow}>
            {currentUser.photoURL ? (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {currentUser.displayName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            )}
            <View>
              <Text style={[styles.nameText, dark ? styles.darkText : styles.lightText]}>
                {currentUser.displayName || "Neuro User"}
              </Text>
              <Text style={[styles.emailText, dark ? styles.darkSub : styles.lightSub]}>
                {currentUser.email}
              </Text>
            </View>
          </View>

          <View style={styles.syncBox}>
            <View style={styles.syncHeader}>
              <Cloud size={16} color="#6366f1" />
              <Text style={[styles.syncTitle, dark ? styles.darkText : styles.lightText]}>Cloud Sync Status</Text>
            </View>
            <Text style={[styles.syncDesc, dark ? styles.darkSub : styles.lightSub]}>
              Your boards and checklists are fully synchronized with the offline store and will auto-sync to Firestore once online.
            </Text>
            <TouchableOpacity
              onPress={triggerCloudSync}
              disabled={isSyncing}
              style={[styles.syncBtn, dark ? styles.darkSyncBtn : styles.lightSyncBtn]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={14} color="#fff" style={{ marginRight: 4 }} />
                  <Text style={styles.syncBtnText}>Sync Now</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoAlert}>
            <Text style={styles.infoAlertText}>
              {isUsingMock ? "⚡ App running in Local Sandbox Mode" : "🌐 App connected to Real Firebase Cloud"}
            </Text>
          </View>

          <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.authContainer}>
      <GlassCard dark={dark} style={styles.authCard}>
        <Text style={[styles.logoText, dark ? styles.darkText : styles.lightText]}>NeuroBoard</Text>
        <Text style={[styles.tagline, dark ? styles.darkSub : styles.lightSub]}>
          AI-powered productivity ecosystem
        </Text>

        {errorMsg && (
          <View style={styles.errorBox}>
            <ShieldAlert size={16} color="#ef4444" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {isRegister && (
          <TextInput
            placeholder="Full Name"
            placeholderTextColor={dark ? "#9ca3af" : "#6b7280"}
            value={displayName}
            onChangeText={setDisplayName}
            style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
          />
        )}

        <TextInput
          placeholder="Email address"
          placeholderTextColor={dark ? "#9ca3af" : "#6b7280"}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={dark ? "#9ca3af" : "#6b7280"}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
        />

        <TouchableOpacity onPress={handleAuth} style={styles.mainBtn} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {isRegister ? <UserPlus size={18} color="#fff" style={{ marginRight: 6 }} /> : <LogIn size={18} color="#fff" style={{ marginRight: 6 }} />}
              <Text style={styles.mainBtnText}>{isRegister ? "Create Account" : "Sign In"}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoogleAuth} style={[styles.googleBtn, dark ? styles.darkGoogleBtn : styles.lightGoogleBtn]}>
          <Text style={[styles.googleBtnText, dark ? styles.darkText : styles.lightText]}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsRegister(!isRegister)} style={styles.toggleLink}>
          <Text style={styles.toggleLinkText}>
            {isRegister ? "Already have an account? Sign In" : "Don't have an account? Create Account"}
          </Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  authCard: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center'
  },
  logoText: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4
  },
  tagline: {
    fontSize: 12,
    marginBottom: 20
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '500'
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 13,
    marginBottom: 12
  },
  lightInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(0,0,0,0.06)',
    color: '#1f2937'
  },
  darkInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#f3f4f6'
  },
  mainBtn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.25
  },
  mainBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14
  },
  googleBtn: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  lightGoogleBtn: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkGoogleBtn: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  googleBtnText: {
    fontSize: 13,
    fontWeight: '600'
  },
  toggleLink: {
    marginTop: 16
  },
  toggleLinkText: {
    fontSize: 12,
    color: '#6366f1',
    fontWeight: '600'
  },
  profileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  profileCard: {
    width: '100%',
    maxWidth: 400
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#818cf8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#818cf8',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    shadowOpacity: 0.2
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold'
  },
  nameText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  emailText: {
    fontSize: 12
  },
  syncBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
    padding: 14,
    marginBottom: 16
  },
  syncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6
  },
  syncTitle: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  syncDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10
  },
  syncBtn: {
    height: 32,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12
  },
  syncBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  infoAlert: {
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
    padding: 10,
    alignItems: 'center',
    marginBottom: 16
  },
  infoAlertText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: 'bold'
  },
  logoutBtn: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: 'bold'
  },
  lightText: {
    color: '#1f2937'
  },
  darkText: {
    color: '#f3f4f6'
  },
  lightSub: {
    color: '#4b5563'
  },
  darkSub: {
    color: '#9ca3af'
  }
});
export default AuthScreen;
