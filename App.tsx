import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Home, Layers, CheckSquare, User, Sun, Moon, RefreshCw, Languages } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Screens
import Dashboard from './src/screens/Dashboard';
import Whiteboard from './src/screens/Whiteboard';
import TaskManager, { TaskData } from './src/screens/TaskManager';
import AuthScreen from './src/screens/AuthScreen';
import { NoteData } from './src/components/StickyNote';
import LanguageSelector, { LanguageCode } from './src/components/LanguageSelector';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<string>('dashboard');
  const [darkTheme, setDarkTheme] = useState<boolean>(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // States
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedNotes = await AsyncStorage.getItem('@neuroboard_notes');
        const storedTasks = await AsyncStorage.getItem('@neuroboard_tasks');
        const storedTheme = await AsyncStorage.getItem('@neuroboard_theme');
        const storedLang = await AsyncStorage.getItem('@neuroboard_lang');
        const storedUser = await AsyncStorage.getItem('@neuroboard_user');

        if (storedNotes) setNotes(JSON.parse(storedNotes));
        else {
          // Add dummy whiteboard items on first boot
          const defaultNotes: NoteData[] = [
            {
              id: 'd1',
              title: "Welcome to NeuroBoard",
              content: "This is an infinite whiteboard note. Double click/tap to drag me around. Click the AI spark button in the top right to start compiling task plans!",
              type: 'text',
              color: '#fef08a',
              pinned: true,
              x: 350,
              y: 40,
              checklist: [],
              comments: [{ id: 'c1', user: "System", text: "Welcome!", time: "Now" }],
              attachments: []
            },
            {
              id: 'd2',
              title: "Project Milestone Checklist",
              content: "",
              type: 'checklist',
              color: '#bbf7d0',
              pinned: false,
              x: 680,
              y: 40,
              checklist: [
                { id: '1', text: "Initialize Expo SPA template", done: true },
                { id: '2', text: "Create whiteboard drawing canvas", done: true },
                { id: '3', text: "Implement NLP voice-to-text rules", done: false },
                { id: '4', text: "Connect offline AsyncStorage sync", done: false }
              ],
              comments: [],
              attachments: []
            }
          ];
          setNotes(defaultNotes);
          await AsyncStorage.setItem('@neuroboard_notes', JSON.stringify(defaultNotes));
        }

        if (storedTasks) setTasks(JSON.parse(storedTasks));
        else {
          const defaultTasks: TaskData[] = [
            { id: 't1', title: "Complete project assignment", status: 'todo', dueDate: new Date(Date.now() + 86400000).toISOString(), priority: 'high', category: 'Study', completed: false },
            { id: 't2', title: "Call Mom at 8 PM", status: 'in_progress', dueDate: new Date().toISOString(), priority: 'medium', category: 'Personal', completed: false },
            { id: 't3', title: "Buy groceries", status: 'completed', dueDate: new Date().toISOString(), priority: 'low', category: 'Personal', completed: true }
          ];
          setTasks(defaultTasks);
          await AsyncStorage.setItem('@neuroboard_tasks', JSON.stringify(defaultTasks));
        }

        if (storedTheme) setDarkTheme(storedTheme === 'dark');
        if (storedLang) setLanguage(storedLang as LanguageCode);
        if (storedUser) setCurrentUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to load local data:", e);
      }
    };
    loadData();
  }, []);

  // Sync helpers
  const saveNotes = async (updatedNotes: NoteData[]) => {
    setNotes(updatedNotes);
    await AsyncStorage.setItem('@neuroboard_notes', JSON.stringify(updatedNotes));
  };

  const saveTasks = async (updatedTasks: TaskData[]) => {
    setTasks(updatedTasks);
    await AsyncStorage.setItem('@neuroboard_tasks', JSON.stringify(updatedTasks));
  };

  const handleToggleTheme = async () => {
    const nextTheme = !darkTheme;
    setDarkTheme(nextTheme);
    await AsyncStorage.setItem('@neuroboard_theme', nextTheme ? 'dark' : 'light');
  };

  const handleLanguageChange = async (lang: LanguageCode) => {
    setLanguage(lang);
    await AsyncStorage.setItem('@neuroboard_lang', lang);
    setShowLanguagePicker(false);
  };

  // Note actions
  const handleAddNote = (note: Partial<NoteData>) => {
    const newNote: NoteData = {
      id: Math.random().toString(36).substring(2, 9),
      title: note.title || "Untitled Note",
      content: note.content || "",
      type: note.type || 'text',
      checklist: note.checklist || [],
      color: note.color || '#fef08a',
      pinned: note.pinned || false,
      x: note.x || 100,
      y: note.y || 100,
      comments: note.comments || [],
      attachments: note.attachments || []
    };
    saveNotes([...notes, newNote]);
  };

  const handleUpdateNote = (id: string, updated: Partial<NoteData>) => {
    const next = notes.map(n => n.id === id ? { ...n, ...updated } : n);
    saveNotes(next);
  };

  const handleDeleteNote = (id: string) => {
    const next = notes.filter(n => n.id !== id);
    saveNotes(next);
  };

  // Task actions
  const handleAddTask = (task: Partial<TaskData>) => {
    const newTask: TaskData = {
      id: Math.random().toString(36).substring(2, 9),
      title: task.title || "New Task",
      dueDate: task.dueDate || new Date().toISOString(),
      priority: task.priority || 'medium',
      category: task.category || 'General',
      completed: task.completed || false,
      status: task.status || 'todo'
    };
    saveTasks([...tasks, newTask]);
  };

  const handleUpdateTask = (id: string, updated: Partial<TaskData>) => {
    const next = tasks.map(t => t.id === id ? { ...t, ...updated } : t);
    saveTasks(next);
  };

  const handleToggleTask = (id: string) => {
    const next = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, status: !t.completed ? 'completed' : 'todo' as any } : t);
    saveTasks(next);
  };

  const handleDeleteTask = (id: string) => {
    const next = tasks.filter(t => t.id !== id);
    saveTasks(next);
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await AsyncStorage.removeItem('@neuroboard_user');
  };

  const triggerManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 1200);
  };

  const handleResetData = async () => {
    try {
      await AsyncStorage.clear();
      if (Platform.OS === 'web') {
        window.location.reload();
      } else {
        setNotes([]);
        setTasks([]);
      }
    } catch (e) {
      console.error("Failed to clear storage:", e);
    }
  };

  // Render correct screen content
  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return (
          <Dashboard
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onNavigate={setActiveScreen}
            dark={darkTheme}
          />
        );
      case 'whiteboard':
        return (
          <Whiteboard
            notes={notes}
            onAddNote={handleAddNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={handleDeleteNote}
            onAddTask={handleAddTask}
            dark={darkTheme}
          />
        );
      case 'tasks':
        return (
          <TaskManager
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            dark={darkTheme}
          />
        );
      case 'profile':
        return (
          <AuthScreen
            currentUser={currentUser}
            onAuthSuccess={handleAuthSuccess}
            onLogout={handleLogout}
            dark={darkTheme}
          />
        );
      default:
        return <Dashboard tasks={tasks} onAddTask={handleAddTask} onToggleTask={handleToggleTask} onNavigate={setActiveScreen} dark={darkTheme} />;
    }
  };

  return (
    <SafeAreaView style={[styles.rootContainer, darkTheme ? styles.darkBg : styles.lightBg]}>
      <StatusBar style={darkTheme ? 'light' : 'dark'} />
      
      {/* Top Header */}
      <View style={[styles.appHeader, darkTheme ? styles.darkBorder : styles.lightBorder]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.appLogoText, darkTheme ? styles.darkText : styles.lightText]}>NeuroBoard</Text>
          <View style={styles.syncStatusRow}>
            <TouchableOpacity onPress={triggerManualSync} disabled={isSyncing}>
              <RefreshCw size={12} color={isSyncing ? '#818cf8' : '#8e8e93'} style={isSyncing && styles.rotating} />
            </TouchableOpacity>
            <Text style={styles.syncStatusTxt}>
              {isSyncing ? "Syncing..." : "Synced Cloud"}
            </Text>
            <TouchableOpacity onPress={handleResetData} style={{ marginLeft: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
              <Text style={{ fontSize: 9, color: '#f87171', fontWeight: 'bold' }}>Reset Data</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Widgets */}
        <View style={styles.headerRight}>
          {/* Language Selector trigger */}
          <TouchableOpacity onPress={() => setShowLanguagePicker(!showLanguagePicker)} style={styles.headerBtn}>
            <Languages size={16} color={darkTheme ? '#f3f4f6' : '#1f2937'} />
          </TouchableOpacity>

          {/* Theme Selector */}
          <TouchableOpacity onPress={handleToggleTheme} style={styles.headerBtn}>
            {darkTheme ? (
              <Sun size={16} color="#f3f4f6" />
            ) : (
              <Moon size={16} color="#1f2937" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Language selection modal overlay */}
      {showLanguagePicker && (
        <View style={[styles.langOverlay, darkTheme ? styles.darkModal : styles.lightModal]}>
          <LanguageSelector currentLang={language} onLanguageChange={handleLanguageChange} dark={darkTheme} />
        </View>
      )}

      {/* Main Workspace Frame */}
      <View style={styles.workspaceBody}>
        {/* Desktop Left navigation column */}
        {Platform.OS === 'web' && (
          <View style={[styles.desktopSidebar, darkTheme ? styles.darkSidebar : styles.lightSidebar]}>
            <TouchableOpacity
              onPress={() => setActiveScreen('dashboard')}
              style={[styles.sidebarLink, activeScreen === 'dashboard' && styles.activeSidebarLink]}
            >
              <Home size={18} color={activeScreen === 'dashboard' ? '#6366f1' : (darkTheme ? '#9ca3af' : '#4b5563')} />
              <Text style={[styles.sidebarLinkText, activeScreen === 'dashboard' && styles.activeSidebarText, darkTheme ? styles.darkText : styles.lightText]}>
                Dashboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveScreen('whiteboard')}
              style={[styles.sidebarLink, activeScreen === 'whiteboard' && styles.activeSidebarLink]}
            >
              <Layers size={18} color={activeScreen === 'whiteboard' ? '#6366f1' : (darkTheme ? '#9ca3af' : '#4b5563')} />
              <Text style={[styles.sidebarLinkText, activeScreen === 'whiteboard' && styles.activeSidebarText, darkTheme ? styles.darkText : styles.lightText]}>
                Whiteboard
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveScreen('tasks')}
              style={[styles.sidebarLink, activeScreen === 'tasks' && styles.activeSidebarLink]}
            >
              <CheckSquare size={18} color={activeScreen === 'tasks' ? '#6366f1' : (darkTheme ? '#9ca3af' : '#4b5563')} />
              <Text style={[styles.sidebarLinkText, activeScreen === 'tasks' && styles.activeSidebarText, darkTheme ? styles.darkText : styles.lightText]}>
                Task Planner
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveScreen('profile')}
              style={[styles.sidebarLink, activeScreen === 'profile' && styles.activeSidebarLink]}
            >
              <User size={18} color={activeScreen === 'profile' ? '#6366f1' : (darkTheme ? '#9ca3af' : '#4b5563')} />
              <Text style={[styles.sidebarLinkText, activeScreen === 'profile' && styles.activeSidebarText, darkTheme ? styles.darkText : styles.lightText]}>
                Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Screen Frame */}
        <View style={styles.screenView}>
          {renderScreen()}
        </View>
      </View>

      {/* Mobile-first bottombar navigation */}
      {Platform.OS !== 'web' && (
        <View style={[styles.bottomBar, darkTheme ? styles.darkBottomBar : styles.lightBottomBar]}>
          <TouchableOpacity onPress={() => setActiveScreen('dashboard')} style={styles.bottomBarLink}>
            <Home size={20} color={activeScreen === 'dashboard' ? '#6366f1' : '#8e8e93'} />
            <Text style={[styles.bottomBarTxt, activeScreen === 'dashboard' && styles.activeBottomTxt]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveScreen('whiteboard')} style={styles.bottomBarLink}>
            <Layers size={20} color={activeScreen === 'whiteboard' ? '#6366f1' : '#8e8e93'} />
            <Text style={[styles.bottomBarTxt, activeScreen === 'whiteboard' && styles.activeBottomTxt]}>Board</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveScreen('tasks')} style={styles.bottomBarLink}>
            <CheckSquare size={20} color={activeScreen === 'tasks' ? '#6366f1' : '#8e8e93'} />
            <Text style={[styles.bottomBarTxt, activeScreen === 'tasks' && styles.activeBottomTxt]}>Tasks</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveScreen('profile')} style={styles.bottomBarLink}>
            <User size={20} color={activeScreen === 'profile' ? '#6366f1' : '#8e8e93'} />
            <Text style={[styles.bottomBarTxt, activeScreen === 'profile' && styles.activeBottomTxt]}>Profile</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'column'
  },
  lightBg: {
    backgroundColor: '#f1f5f9'
  },
  darkBg: {
    backgroundColor: '#090d16'
  },
  appHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    zIndex: 70
  },
  lightBorder: {
    borderBottomColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff'
  },
  darkBorder: {
    borderBottomColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0b0f19'
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  appLogoText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  syncStatusTxt: {
    fontSize: 9,
    color: '#8e8e93',
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  headerBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  langOverlay: {
    position: 'absolute',
    top: 56,
    right: 56,
    width: 260,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    backdropFilter: 'blur(10px)'
  },
  lightModal: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkModal: {
    backgroundColor: 'rgba(11, 15, 25, 0.95)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  workspaceBody: {
    flex: 1,
    flexDirection: 'row'
  },
  desktopSidebar: {
    width: 220,
    borderRightWidth: 1,
    padding: 12,
    gap: 8
  },
  lightSidebar: {
    borderRightColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff'
  },
  darkSidebar: {
    borderRightColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0b0f19'
  },
  sidebarLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    transitionProperty: 'all',
    transitionDuration: '150ms'
  },
  activeSidebarLink: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)'
  },
  sidebarLinkText: {
    fontSize: 12,
    fontWeight: '600'
  },
  activeSidebarText: {
    color: '#6366f1'
  },
  screenView: {
    flex: 1,
    overflow: 'hidden'
  },
  bottomBar: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1
  },
  lightBottomBar: {
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: '#ffffff'
  },
  darkBottomBar: {
    borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: '#0b0f19'
  },
  bottomBarLink: {
    alignItems: 'center',
    gap: 3
  },
  bottomBarTxt: {
    fontSize: 9,
    color: '#8e8e93',
    fontWeight: '600'
  },
  activeBottomTxt: {
    color: '#6366f1'
  },
  lightText: {
    color: '#1f2937'
  },
  darkText: {
    color: '#f3f4f6'
  },
  rotating: {
    transform: [{ rotate: '360deg' }]
  }
});
