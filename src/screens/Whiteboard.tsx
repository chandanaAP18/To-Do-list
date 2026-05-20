import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Plus, ListTodo, Search, Share2, Sparkles, X, Users } from 'lucide-react-native';
import BoardCanvas from '../components/BoardCanvas';
import AIAssistant from '../components/AIAssistant';
import { NoteData } from '../components/StickyNote';
import { aiService } from '../config/api';

interface WhiteboardProps {
  notes: NoteData[];
  onAddNote: (note: Partial<NoteData>) => void;
  onUpdateNote: (id: string, updated: Partial<NoteData>) => void;
  onDeleteNote: (id: string) => void;
  onAddTask: (task: any) => void;
  dark?: boolean;
}

export const Whiteboard: React.FC<WhiteboardProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAddTask,
  dark = false
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [collaborators, setCollaborators] = useState<string[]>(["Alice", "Bob"]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [newCollabName, setNewCollabName] = useState("");

  const handleAddTextNote = () => {
    onAddNote({
      title: "New Note",
      content: "",
      type: 'text',
      color: '#fef08a',
      x: 150 + Math.random() * 80,
      y: 150 + Math.random() * 80,
      pinned: false,
      checklist: [],
      comments: [],
      attachments: []
    });
  };

  const handleAddChecklistNote = () => {
    onAddNote({
      title: "New Checklist",
      content: "",
      type: 'checklist',
      color: '#bbf7d0',
      x: 150 + Math.random() * 80,
      y: 150 + Math.random() * 80,
      pinned: false,
      checklist: [],
      comments: [],
      attachments: []
    });
  };

  const handleAddCollab = () => {
    if (newCollabName.trim()) {
      setCollaborators(prev => [...prev, newCollabName.trim()]);
      setNewCollabName("");
    }
  };

  const handleAiOrganize = async () => {
    const organized = await aiService.organizeBoard(notes);
    organized.forEach(item => {
      onUpdateNote(item.id, { x: item.x, y: item.y });
    });
  };

  const handleAddNoteFromAi = (note: any) => {
    onAddNote({
      ...note,
      x: 150 + Math.random() * 50,
      y: 150 + Math.random() * 50
    });
  };

  // Filter notes by query
  const filteredNotes = notes.filter(n =>
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={styles.container}>
      {/* Top Header Control bar */}
      <View style={[styles.controlBar, dark ? styles.darkBar : styles.lightBar]}>
        
        {/* Left Side: Add buttons */}
        <View style={styles.barGroup}>
          <TouchableOpacity onPress={handleAddTextNote} style={styles.actionBtn}>
            <Plus size={16} color="#fff" />
            <Text style={styles.actionBtnTxt}>Add Sticky</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddChecklistNote} style={[styles.actionBtn, styles.secondaryBtn]}>
            <ListTodo size={16} color="#6366f1" />
            <Text style={[styles.actionBtnTxt, styles.secondaryBtnTxt]}>Add Checklist</Text>
          </TouchableOpacity>
        </View>

        {/* Center: Search notes */}
        <View style={styles.searchContainer}>
          <Search size={14} color={dark ? "#94a3b8" : "#64748b"} style={{ marginLeft: 8 }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search notes / tags..."
            placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
            style={[styles.searchInput, dark ? styles.darkInput : styles.lightInput]}
          />
        </View>

        {/* Right Side: Collabs and AI */}
        <View style={styles.barGroup}>
          <TouchableOpacity onPress={() => setShowShareModal(!showShareModal)} style={styles.iconButton}>
            <Users size={16} color={dark ? "#f3f4f6" : "#1f2937"} />
            <Text style={[styles.collabCountText, dark ? styles.darkText : styles.lightText]}>
              {collaborators.length}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowAiHelper(!showAiHelper)} style={[styles.aiBtn, showAiHelper && styles.activeAiBtn]}>
            <Sparkles size={16} color={showAiHelper ? "#fff" : "#6366f1"} />
            <Text style={[styles.aiBtnTxt, showAiHelper && styles.activeAiText]}>Ask AI</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Canvas Body */}
      <View style={styles.canvasContainer}>
        <BoardCanvas
          notes={filteredNotes}
          onAddNote={onAddNote}
          onUpdateNote={onUpdateNote}
          onDeleteNote={onDeleteNote}
          dark={dark}
        />

        {/* Sidebar AI Assistant drawer */}
        {showAiHelper && (
          <View style={[styles.sidebar, dark ? styles.darkSidebar : styles.lightSidebar]}>
            <View style={styles.sidebarHeader}>
              <Text style={[styles.sidebarTitle, dark ? styles.darkText : styles.lightText]}>AI Workspace Helper</Text>
              <TouchableOpacity onPress={() => setShowAiHelper(false)}>
                <X size={18} color={dark ? "#94a3b8" : "#475569"} />
              </TouchableOpacity>
            </View>
            <AIAssistant
              notes={notes}
              onOrganizeBoard={handleAiOrganize}
              onAddNote={handleAddNoteFromAi}
              onAddTask={onAddTask}
              dark={dark}
            />
          </View>
        )}

        {/* Share/Collaborators modal */}
        {showShareModal && (
          <View style={[styles.shareModal, dark ? styles.darkShareModal : styles.lightShareModal]}>
            <View style={styles.shareHeader}>
              <Text style={[styles.shareTitle, dark ? styles.darkText : styles.lightText]}>Board Collaboration</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <X size={14} color={dark ? "#94a3b8" : "#475569"} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.shareDesc, dark ? styles.darkSub : styles.lightSub]}>
              Members active on this board:
            </Text>
            <View style={styles.collabsList}>
              {collaborators.map(c => (
                <View key={c} style={[styles.collabTag, dark ? styles.darkCollabTag : styles.lightCollabTag]}>
                  <View style={styles.collabDot} />
                  <Text style={[styles.collabName, dark ? styles.darkText : styles.lightText]}>{c}</Text>
                </View>
              ))}
            </View>
            <View style={styles.addCollabRow}>
              <TextInput
                value={newCollabName}
                onChangeText={setNewCollabName}
                placeholder="Name..."
                placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
                style={[styles.collabInput, dark ? styles.darkInput : styles.lightInput]}
              />
              <TouchableOpacity onPress={handleAddCollab} style={styles.collabAddBtn}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column'
  },
  controlBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
    zIndex: 60,
  },
  lightBar: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  darkBar: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  barGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.15
  },
  actionBtnTxt: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  secondaryBtn: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    shadowOpacity: 0
  },
  secondaryBtnTxt: {
    color: '#6366f1'
  },
  searchContainer: {
    flex: 1,
    maxWidth: 320,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden'
  },
  searchInput: {
    flex: 1,
    height: 34,
    paddingHorizontal: 8,
    fontSize: 12,
    borderWidth: 0
  },
  lightInput: {
    color: '#000'
  },
  darkInput: {
    color: '#fff'
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.03)'
  },
  collabCountText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  aiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10
  },
  activeAiBtn: {
    backgroundColor: '#6366f1'
  },
  aiBtnTxt: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: 'bold'
  },
  activeAiText: {
    color: '#fff'
  },
  canvasContainer: {
    flex: 1,
    position: 'relative'
  },
  sidebar: {
    position: 'absolute',
    top: 16,
    right: 16,
    bottom: 16,
    width: 320,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.15,
    backdropFilter: 'blur(10px)',
  },
  lightSidebar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkSidebar: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  sidebarTitle: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  shareModal: {
    position: 'absolute',
    top: 66,
    right: 76,
    width: 240,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    zIndex: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    shadowOpacity: 0.1,
    backdropFilter: 'blur(10px)'
  },
  lightShareModal: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkShareModal: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  shareTitle: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  shareDesc: {
    fontSize: 9,
    marginBottom: 6
  },
  collabsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8
  },
  collabTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  lightCollabTag: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: 'rgba(0,0,0,0.04)'
  },
  darkCollabTag: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)'
  },
  collabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981'
  },
  collabName: {
    fontSize: 9,
    fontWeight: '500'
  },
  addCollabRow: {
    flexDirection: 'row',
    gap: 6
  },
  collabInput: {
    flex: 1,
    height: 24,
    fontSize: 10,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6
  },
  collabAddBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingHorizontal: 8,
    justifyContent: 'center'
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
export default Whiteboard;
