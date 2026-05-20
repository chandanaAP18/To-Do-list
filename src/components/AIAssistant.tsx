import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Sparkles, Send, RefreshCw, BookOpen, Calendar, HelpCircle, ListTodo } from 'lucide-react-native';
import { aiService } from '../config/api';
import GlassCard from './GlassCard';

interface AIAssistantProps {
  notes: any[];
  onOrganizeBoard: () => void;
  onAddNote: (note: any) => void;
  onAddTask: (task: any) => void;
  dark?: boolean;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  notes,
  onOrganizeBoard,
  onAddNote,
  onAddTask,
  dark = false
}) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'ai', text: "Hello! I'm your NeuroBoard AI. I can clean up your whiteboard, parse text deadlines, compile study plans, or summarize your sticky notes. How can I help you focus today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim()) return;

    const userMsg: Message = { id: Math.random().toString(), sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    // Call service or simulate response
    setTimeout(async () => {
      let reply = "I've processed your request. Let me know if there's anything else I can do!";
      
      const query = textToSend.toLowerCase();
      if (query.includes("summarize")) {
        const boardContent = notes.map(n => `[${n.title}]: ${n.content || ''}`).join('\n');
        reply = await aiService.summarize(boardContent || "No current whiteboard notes found.");
      } else if (query.includes("study plan") || query.includes("exam")) {
        reply = `**AI Study Plan Generated**\n\n1. **Core Review (Day 1-2)**: Concentrate on key terms and read outline summaries.\n2. **Practice Set (Day 3)**: Tackle mock exam questions.\n3. **Wrap-up (Day 4)**: Refine complex items and review notes.\n\n*Created study notes to help you review.*`;
        onAddNote({
          id: Math.random().toString(),
          title: "AI Study Plan Summary",
          content: "Review Syllabus\nPractice Mock Set\nRefine Weak Topics",
          type: 'checklist',
          checklist: [
            { id: '1', text: "Review core definitions", done: false },
            { id: '2', text: "Attempt 3 sample exercises", done: false },
            { id: '3', text: "Revise formulas", done: false }
          ],
          color: '#e9d5ff',
          pinned: false,
          x: 100,
          y: 200,
          comments: [],
          attachments: []
        });
      } else if (query.includes("organize") || query.includes("clean")) {
        onOrganizeBoard();
        reply = "I've cleaned up and structured the layout of your whiteboard notes in a grid format.";
      } else if (query.includes("meeting") || query.includes("minutes")) {
        reply = `**AI Meeting Notes Generated**\n\n- **Date**: ${new Date().toLocaleDateString()}\n- **Agenda**: Sync project tasks & next milestones.\n- **Action Items**:\n  1. Finalize dashboard implementation (Due tomorrow).\n  2. Wire up authentication routes.`;
        onAddNote({
          id: Math.random().toString(),
          title: "AI Meeting Minutes",
          content: "Agenda: Weekly roadmap sync.\nMinutes:\n- Completed initial canvas rendering.\n- Discovered dependencies conflict.\n- Target deployment deadline set for next Friday.",
          type: 'text',
          color: '#bfdbfe',
          pinned: true,
          x: 200,
          y: 150,
          comments: [],
          attachments: []
        });
      } else if (query.includes("task") || query.includes("todo")) {
        reply = "I've parsed your notes and extracted key tasks onto your board!";
        onAddTask({
          id: Math.random().toString(),
          title: "Review notes and update milestones",
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          priority: 'medium',
          category: 'Work',
          completed: false
        });
      }

      setMessages(prev => [...prev, { id: Math.random().toString(), sender: 'ai', text: reply }]);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <GlassCard dark={dark} style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={18} color="#818cf8" />
        <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>Neuro AI Assistant</Text>
      </View>

      {/* Messages list */}
      <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubble,
              msg.sender === 'user' ? styles.userBubble : (dark ? styles.darkAiBubble : styles.lightAiBubble)
            ]}
          >
            <Text style={[
              styles.bubbleText,
              msg.sender === 'user' ? styles.userText : (dark ? styles.darkText : styles.lightText)
            ]}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#818cf8" />
            <Text style={[styles.loadingText, dark ? styles.darkSub : styles.lightSub]}>AI is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Shortcuts */}
      <Text style={[styles.sectionTitle, dark ? styles.darkSub : styles.lightSub]}>Quick Tasks:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shortcutsRow}>
        <TouchableOpacity onPress={() => handleSend("Summarize my current whiteboard notes")} style={[styles.shortcutBtn, dark ? styles.darkShortcut : styles.lightShortcut]}>
          <ListTodo size={13} color="#818cf8" />
          <Text style={[styles.shortcutTxt, dark ? styles.darkText : styles.lightText]}>Summarize Board</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onOrganizeBoard} style={[styles.shortcutBtn, dark ? styles.darkShortcut : styles.lightShortcut]}>
          <RefreshCw size={13} color="#818cf8" />
          <Text style={[styles.shortcutTxt, dark ? styles.darkText : styles.lightText]}>Auto-Organize</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSend("Generate a study plan for exams")} style={[styles.shortcutBtn, dark ? styles.darkShortcut : styles.lightShortcut]}>
          <BookOpen size={13} color="#818cf8" />
          <Text style={[styles.shortcutTxt, dark ? styles.darkText : styles.lightText]}>Study Planner</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSend("Generate meeting minutes from notes")} style={[styles.shortcutBtn, dark ? styles.darkShortcut : styles.lightShortcut]}>
          <Calendar size={13} color="#818cf8" />
          <Text style={[styles.shortcutTxt, dark ? styles.darkText : styles.lightText]}>Meeting Notes</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Input panel */}
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask AI helper..."
          placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
          onSubmitEditing={() => handleSend()}
          style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
        />
        <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
          <Send size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 380,
    width: '100%',
    padding: 14,
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
    marginBottom: 6
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatArea: {
    flex: 1,
    marginBottom: 8
  },
  chatContent: {
    gap: 8,
    paddingVertical: 4
  },
  bubble: {
    padding: 10,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
  },
  lightAiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)'
  },
  darkAiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)'
  },
  bubbleText: {
    fontSize: 12,
    lineHeight: 16
  },
  userText: {
    color: '#ffffff'
  },
  lightText: {
    color: '#1e293b'
  },
  darkText: {
    color: '#f1f5f9'
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6
  },
  loadingText: {
    fontSize: 11
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  shortcutsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    maxHeight: 34
  },
  shortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1
  },
  lightShortcut: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkShortcut: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  shortcutTxt: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center'
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 12
  },
  lightInput: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: 'rgba(0,0,0,0.06)',
    color: '#000'
  },
  darkInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.06)',
    color: '#fff'
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lightSub: {
    color: '#475569'
  },
  darkSub: {
    color: '#94a3b8'
  }
});
export default AIAssistant;
