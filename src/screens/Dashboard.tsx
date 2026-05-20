import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar as CalendarIcon, CheckSquare, Clock, Plus, PenTool, LayoutDashboard, Smile } from 'lucide-react-native';
import PomodoroTimer from '../components/PomodoroTimer';
import VoiceRecorder from '../components/VoiceRecorder';
import GlassCard from '../components/GlassCard';
import { ParsedTask } from '../utils/nlp';

interface DashboardProps {
  tasks: any[];
  onAddTask: (task: any) => void;
  onToggleTask: (id: string) => void;
  onNavigate: (screen: string) => void;
  dark?: boolean;
}

type MoodTheme = 'focus' | 'calm' | 'energized' | 'creative';

const MOODS: Record<MoodTheme, { emoji: string; label: string; color: string }> = {
  focus: { emoji: '🎯', label: 'Deep Focus', color: '#6366f1' },
  calm: { emoji: '🍃', label: 'Calm/Relax', color: '#10b981' },
  energized: { emoji: '⚡', label: 'Energized', color: '#f59e0b' },
  creative: { emoji: '🎨', label: 'Creative', color: '#ec4899' }
};

export const Dashboard: React.FC<DashboardProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onNavigate,
  dark = false
}) => {
  const [mood, setMood] = useState<MoodTheme>('focus');

  // Filter tasks due today
  const todayTasks = tasks.filter(t => !t.completed).slice(0, 3);
  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleVoiceTaskCreated = (parsed: ParsedTask) => {
    onAddTask({
      id: Math.random().toString(),
      title: parsed.title,
      dueDate: parsed.dueDate,
      priority: parsed.priority,
      category: parsed.category,
      completed: false
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Welcome Heading */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, dark ? styles.darkText : styles.lightText]}>Hello, Achiever 👋</Text>
          <Text style={[styles.subText, dark ? styles.darkSub : styles.lightSub]}>Ready to organize your mind today?</Text>
        </View>
      </View>

      {/* Mood theme row */}
      <View style={styles.sectionContainer}>
        <Text style={[styles.sectionTitle, dark ? styles.darkText : styles.lightText]}>Current State / Mood</Text>
        <View style={styles.moodGrid}>
          {(Object.keys(MOODS) as MoodTheme[]).map(m => (
            <TouchableOpacity
              key={m}
              onPress={() => setMood(m)}
              style={[
                styles.moodCard,
                dark ? styles.darkMoodCard : styles.lightMoodCard,
                mood === m && { borderColor: MOODS[m].color, borderWidth: 1.5 }
              ]}
            >
              <Text style={styles.moodEmoji}>{MOODS[m].emoji}</Text>
              <Text style={[styles.moodLabel, dark ? styles.darkText : styles.lightText]}>{MOODS[m].label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Main Grid Widgets */}
      <View style={styles.grid}>
        {/* Left Column */}
        <View style={styles.column}>
          {/* Quick Boards launch */}
          <GlassCard dark={dark} style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <PenTool size={16} color={MOODS[mood].color} />
              <Text style={[styles.widgetTitle, dark ? styles.darkText : styles.lightText]}>Active Workspace</Text>
            </View>
            <Text style={[styles.widgetDesc, dark ? styles.darkSub : styles.lightSub]}>
              Infinite drawing board, canvas notes, shape sketch & group sticky notes.
            </Text>
            <TouchableOpacity
              onPress={() => onNavigate('whiteboard')}
              style={[styles.launchBtn, { backgroundColor: MOODS[mood].color }]}
            >
              <Text style={styles.launchBtnText}>Launch Whiteboard</Text>
            </TouchableOpacity>
          </GlassCard>

          {/* Voice to Task extraction */}
          <VoiceRecorder onTaskCreated={handleVoiceTaskCreated} dark={dark} />
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          {/* Pomodoro Timer widget */}
          <PomodoroTimer dark={dark} />

          {/* Productivity Analytics */}
          <GlassCard dark={dark} style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <LayoutDashboard size={16} color={MOODS[mood].color} />
              <Text style={[styles.widgetTitle, dark ? styles.darkText : styles.lightText]}>Daily Analytics</Text>
            </View>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsStats}>
                <Text style={[styles.analyticsVal, dark ? styles.darkText : styles.lightText]}>
                  {completedCount}/{totalCount}
                </Text>
                <Text style={[styles.analyticsLbl, dark ? styles.darkSub : styles.lightSub]}>Tasks Done</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarOuter, dark ? styles.darkProgressOuter : styles.lightProgressOuter]}>
                  <View style={[styles.progressBarInner, { width: `${completionPercentage}%`, backgroundColor: MOODS[mood].color }]} />
                </View>
                <Text style={[styles.progressPctText, dark ? styles.darkText : styles.lightText]}>
                  {completionPercentage}% completed
                </Text>
              </View>
            </View>
          </GlassCard>

          {/* Due Today Tasks List */}
          <GlassCard dark={dark} style={styles.widgetCard}>
            <View style={styles.widgetHeader}>
              <CheckSquare size={16} color={MOODS[mood].color} />
              <Text style={[styles.widgetTitle, dark ? styles.darkText : styles.lightText]}>Due Tasks ({todayTasks.length})</Text>
            </View>
            
            <View style={styles.taskList}>
              {todayTasks.length > 0 ? (
                todayTasks.map(t => (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => onToggleTask(t.id)}
                    style={[styles.taskRow, dark ? styles.darkTaskRow : styles.lightTaskRow]}
                  >
                    <View style={[styles.priorityBadge, { backgroundColor: t.priority === 'high' ? '#f43f5e' : t.priority === 'medium' ? '#f59e0b' : '#3b82f6' }]} />
                    <Text style={[styles.taskRowText, dark ? styles.darkText : styles.lightText]} numberOfLines={1}>
                      {t.title}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={[styles.emptyText, dark ? styles.darkSub : styles.lightSub]}>No pending tasks due today!</Text>
              )}
            </View>
            <TouchableOpacity onPress={() => onNavigate('tasks')} style={styles.linkButton}>
              <Text style={[styles.linkBtnText, { color: MOODS[mood].color }]}>Manage Kanban Planner &rarr;</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    padding: 16,
    gap: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5
  },
  subText: {
    fontSize: 12
  },
  sectionContainer: {
    width: '100%'
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  moodGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  moodCard: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    transitionProperty: 'all',
    transitionDuration: '200ms'
  },
  lightMoodCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(0,0,0,0.05)'
  },
  darkMoodCard: {
    backgroundColor: 'rgba(22, 28, 45, 0.5)',
    borderColor: 'rgba(255,255,255,0.05)'
  },
  moodEmoji: {
    fontSize: 18,
    marginBottom: 4
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16
  },
  column: {
    flex: 1,
    minWidth: 320,
    gap: 16
  },
  widgetCard: {
    width: '100%',
    padding: 16
  },
  widgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10
  },
  widgetTitle: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  widgetDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 14
  },
  launchBtn: {
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  launchBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  analyticsStats: {
    alignItems: 'center'
  },
  analyticsVal: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  analyticsLbl: {
    fontSize: 9,
    fontWeight: '500'
  },
  progressBarContainer: {
    flex: 1,
    gap: 4
  },
  progressBarOuter: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    overflow: 'hidden'
  },
  lightProgressOuter: {
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  darkProgressOuter: {
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  progressBarInner: {
    height: '100%',
    borderRadius: 4
  },
  progressPctText: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  taskList: {
    gap: 6
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1
  },
  lightTaskRow: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(0,0,0,0.03)'
  },
  darkTaskRow: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.03)'
  },
  priorityBadge: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  taskRowText: {
    fontSize: 11,
    fontWeight: '500'
  },
  emptyText: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 4
  },
  linkButton: {
    marginTop: 12,
    alignSelf: 'flex-start'
  },
  linkBtnText: {
    fontSize: 11,
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
export default Dashboard;
