import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Plus, Calendar, AlertTriangle, Clock, RefreshCw, BarChart2, Sparkles } from 'lucide-react-native';
import GlassCard from '../components/GlassCard';
import { parseNaturalLanguageTask } from '../utils/nlp';

export interface TaskData {
  id: string;
  title: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  completed: boolean;
  status: 'todo' | 'in_progress' | 'review' | 'completed';
}

interface TaskManagerProps {
  tasks: TaskData[];
  onAddTask: (task: Partial<TaskData>) => void;
  onUpdateTask: (id: string, updated: Partial<TaskData>) => void;
  onDeleteTask: (id: string) => void;
  dark?: boolean;
}

const COLUMNS: Array<{ key: TaskData['status']; label: string; color: string }> = [
  { key: 'todo', label: 'To Do', color: '#3b82f6' },
  { key: 'in_progress', label: 'In Progress', color: '#f59e0b' },
  { key: 'review', label: 'Review', color: '#8b5cf6' },
  { key: 'completed', label: 'Completed', color: '#10b981' }
];

const CATEGORIES = ["General", "Work", "Study", "Personal"];

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  dark = false
}) => {
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar' | 'analytics'>('kanban');
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Adding task fields
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newCategory, setNewCategory] = useState("General");
  const [newDueDate, setNewDueDate] = useState("Tomorrow");
  const [nlpCommand, setNlpCommand] = useState("");

  const handleNlpSubmit = () => {
    if (nlpCommand.trim()) {
      const parsed = parseNaturalLanguageTask(nlpCommand);
      if (parsed) {
        onAddTask({
          title: parsed.title,
          priority: parsed.priority,
          category: parsed.category,
          dueDate: parsed.dueDate,
          completed: false,
          status: 'todo'
        });
        setNlpCommand("");
      }
    }
  };

  const handleCreateTask = () => {
    if (newTitle.trim()) {
      let date = new Date();
      if (newDueDate.toLowerCase() === 'tomorrow') {
        date.setDate(date.getDate() + 1);
      } else if (newDueDate.toLowerCase() === 'next week') {
        date.setDate(date.getDate() + 7);
      }

      onAddTask({
        title: newTitle.trim(),
        priority: newPriority,
        category: newCategory,
        dueDate: date.toISOString(),
        completed: false,
        status: 'todo'
      });

      setNewTitle("");
      setShowAddForm(false);
    }
  };

  const moveTask = (taskId: string, currentStatus: TaskData['status']) => {
    const statuses: TaskData['status'][] = ['todo', 'in_progress', 'review', 'completed'];
    const currentIndex = statuses.indexOf(currentStatus);
    const nextIndex = (currentIndex + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    onUpdateTask(taskId, {
      status: nextStatus,
      completed: nextStatus === 'completed'
    });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => selectedCategory === 'All' || t.category === selectedCategory);

  // Compute analytics
  const total = filteredTasks.length;
  const done = filteredTasks.filter(t => t.status === 'completed').length;
  const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
  const review = filteredTasks.filter(t => t.status === 'review').length;
  const todo = filteredTasks.filter(t => t.status === 'todo').length;

  return (
    <View style={styles.container}>
      {/* Navigation and Category filter tabs */}
      <View style={[styles.filterBar, dark ? styles.darkBar : styles.lightBar]}>
        
        {/* Navigation Tabs */}
        <View style={styles.tabGroup}>
          <TouchableOpacity
            onPress={() => setActiveTab('kanban')}
            style={[styles.tab, activeTab === 'kanban' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'kanban' && styles.activeTabText, dark ? styles.darkText : styles.lightText]}>
              Kanban
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('calendar')}
            style={[styles.tab, activeTab === 'calendar' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'calendar' && styles.activeTabText, dark ? styles.darkText : styles.lightText]}>
              Calendar
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('analytics')}
            style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText, dark ? styles.darkText : styles.lightText]}>
              Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilters}>
          {["All", ...CATEGORIES].map(cat => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryBtn,
                selectedCategory === cat ? styles.activeCategoryBtn : (dark ? styles.darkCategoryBtn : styles.lightCategoryBtn)
              ]}
            >
              <Text style={[styles.categoryBtnTxt, selectedCategory === cat && styles.activeCategoryBtnTxt, dark ? styles.darkText : styles.lightText]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={() => setShowAddForm(!showAddForm)} style={styles.addBtn}>
          <Plus size={16} color="#fff" />
          <Text style={styles.addBtnTxt}>Task</Text>
        </TouchableOpacity>
      </View>

      {/* Multilingual NLP Quick Command Box */}
      <View style={[styles.nlpContainer, dark ? styles.darkNlp : styles.lightNlp]}>
        <Sparkles size={16} color="#818cf8" style={{ marginRight: 8 }} />
        <TextInput
          value={nlpCommand}
          onChangeText={setNlpCommand}
          placeholder="Speech / Type Command: e.g. 'Rappelle-moi demain devoirs' or 'Morgen um 9h lernen einkaufen'"
          placeholderTextColor={dark ? "#64748b" : "#94a3b8"}
          style={[styles.nlpInput, dark ? styles.darkText : styles.lightText]}
        />
        <TouchableOpacity onPress={handleNlpSubmit} style={styles.nlpSubmitBtn}>
          <Text style={styles.nlpSubmitText}>Add AI Task</Text>
        </TouchableOpacity>
      </View>

      {/* Add Task Form overlay widget */}
      {showAddForm && (
        <GlassCard dark={dark} style={styles.formContainer}>
          <Text style={[styles.formTitle, dark ? styles.darkText : styles.lightText]}>Create New Task</Text>
          <TextInput
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="What needs to be done?"
            placeholderTextColor={dark ? "#94a3b8" : "#64748b"}
            style={[styles.formInput, dark ? styles.darkInput : styles.lightInput]}
          />
          <View style={styles.formRow}>
            {/* Priority Picker */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, dark ? styles.darkSub : styles.lightSub]}>Priority</Text>
              <View style={styles.selectorRow}>
                {(['low', 'medium', 'high'] as const).map(p => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => setNewPriority(p)}
                    style={[styles.selectBtn, newPriority === p && { backgroundColor: '#6366f1' }]}
                  >
                    <Text style={[styles.selectBtnTxt, newPriority === p && { color: '#fff' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category Picker */}
            <View style={{ flex: 1 }}>
              <Text style={[styles.formLabel, dark ? styles.darkSub : styles.lightSub]}>Category</Text>
              <View style={styles.selectorRow}>
                {CATEGORIES.slice(0, 3).map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setNewCategory(c)}
                    style={[styles.selectBtn, newCategory === c && { backgroundColor: '#6366f1' }]}
                  >
                    <Text style={[styles.selectBtnTxt, newCategory === c && { color: '#fff' }]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.formButtons}>
            <TouchableOpacity onPress={handleCreateTask} style={styles.submitBtn}>
              <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>Create Task</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddForm(false)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, dark ? styles.darkText : styles.lightText]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      )}

      {/* Main panels based on tab selection */}
      {activeTab === 'kanban' && (
        <ScrollView horizontal contentContainerStyle={styles.boardColumns}>
          {COLUMNS.map(col => {
            const columnTasks = filteredTasks.filter(t => t.status === col.key);
            return (
              <View key={col.key} style={styles.boardColumn}>
                {/* Column header */}
                <View style={styles.columnHeader}>
                  <View style={[styles.columnHeaderDot, { backgroundColor: col.color }]} />
                  <Text style={[styles.columnLabel, dark ? styles.darkText : styles.lightText]}>
                    {col.label}
                  </Text>
                  <View style={[styles.columnBadge, dark ? styles.darkBadge : styles.lightBadge]}>
                    <Text style={[styles.columnBadgeTxt, dark ? styles.darkText : styles.lightText]}>
                      {columnTasks.length}
                    </Text>
                  </View>
                </View>

                {/* Column cards scroll */}
                <ScrollView contentContainerStyle={styles.columnCards}>
                  {columnTasks.map(task => {
                    const isOverdue = new Date(task.dueDate).getTime() < Date.now() && task.status !== 'completed';
                    return (
                      <GlassCard key={task.id} dark={dark} style={styles.taskCard}>
                        <View style={styles.cardHeader}>
                          <View style={[styles.priorityTag, { backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#3b82f6' }]}>
                            <Text style={styles.priorityTagTxt}>{task.priority}</Text>
                          </View>
                          <Text style={[styles.categoryTag, dark ? styles.darkSub : styles.lightSub]}>
                            {task.category}
                          </Text>
                        </View>

                        <Text style={[styles.taskTitle, dark ? styles.darkText : styles.lightText]}>
                          {task.title}
                        </Text>

                        {/* Due warning */}
                        <View style={styles.dateRow}>
                          <Clock size={12} color={isOverdue ? '#ef4444' : '#64748b'} />
                          <Text style={[styles.dateText, isOverdue ? styles.overdueText : (dark ? styles.darkSub : styles.lightSub)]}>
                            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </Text>
                          {isOverdue && <AlertTriangle size={12} color="#ef4444" />}
                        </View>

                        {/* Footer button */}
                        <View style={styles.cardFooter}>
                          <TouchableOpacity
                            onPress={() => moveTask(task.id, task.status)}
                            style={styles.moveBtn}
                          >
                            <RefreshCw size={11} color="#6366f1" />
                            <Text style={styles.moveBtnTxt}>Next State</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => onDeleteTask(task.id)}>
                            <Text style={styles.deleteLink}>Delete</Text>
                          </TouchableOpacity>
                        </View>
                      </GlassCard>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {activeTab === 'calendar' && (
        <ScrollView style={styles.calendarContainer}>
          <GlassCard dark={dark} style={styles.calendarCard}>
            <View style={styles.calendarHeaderRow}>
              <Calendar size={18} color="#6366f1" />
              <Text style={[styles.calendarTitle, dark ? styles.darkText : styles.lightText]}>Productivity Calendar</Text>
            </View>
            <Text style={[styles.calendarDesc, dark ? styles.darkSub : styles.lightSub]}>
              A schedule mapping of all due tasks and reminders.
            </Text>

            <View style={styles.calendarTimeline}>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(t => (
                  <View key={t.id} style={styles.timelineRow}>
                    <Text style={[styles.timelineTime, dark ? styles.darkText : styles.lightText]}>
                      {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </Text>
                    <View style={styles.timelineSeparator}>
                      <View style={[styles.timelineDot, { backgroundColor: t.status === 'completed' ? '#10b981' : '#6366f1' }]} />
                      <View style={styles.timelineLine} />
                    </View>
                    <View style={[styles.timelineCard, dark ? styles.darkTimelineCard : styles.lightTimelineCard]}>
                      <Text style={[styles.timelineCardTxt, dark ? styles.darkText : styles.lightText]}>
                        {t.title}
                      </Text>
                      <Text style={styles.timelineCardCat}>{t.category} • Priority: {t.priority}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={[styles.emptyText, dark ? styles.darkSub : styles.lightSub]}>No scheduled reminders found.</Text>
              )}
            </View>
          </GlassCard>
        </ScrollView>
      )}

      {activeTab === 'analytics' && (
        <ScrollView style={styles.analyticsContainer}>
          <GlassCard dark={dark} style={styles.analyticsCard}>
            <View style={styles.analyticsHeaderRow}>
              <BarChart2 size={18} color="#6366f1" />
              <Text style={[styles.analyticsTitle, dark ? styles.darkText : styles.lightText]}>Ecosystem Analytics</Text>
            </View>

            <View style={styles.analyticsStatsGrid}>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, dark ? styles.darkText : styles.lightText]}>{total}</Text>
                <Text style={styles.statLbl}>Total Tasks</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#10b981' }]}>{done}</Text>
                <Text style={styles.statLbl}>Completed</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#f59e0b' }]}>{inProgress}</Text>
                <Text style={styles.statLbl}>In Progress</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={[styles.statVal, { color: '#3b82f6' }]}>{todo}</Text>
                <Text style={styles.statLbl}>Backlog</Text>
              </View>
            </View>

            {/* Performance suggestions */}
            <View style={styles.insightsBox}>
              <Text style={[styles.insightsTitle, dark ? styles.darkText : styles.lightText]}>💡 AI Productivity Insight</Text>
              <Text style={[styles.insightsDesc, dark ? styles.darkSub : styles.lightSub]}>
                {done / total > 0.7
                  ? "Outstanding! You are completing over 70% of your tasks. Maintain this momentum."
                  : "Insight: You currently have multiple items listed under In Progress. Try focusing on one task using the Pomodoro widget to reduce multitasking overhead."}
              </Text>
            </View>
          </GlassCard>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column'
  },
  filterBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
    zIndex: 60
  },
  lightBar: {
    backgroundColor: '#ffffff',
    borderBottomColor: 'rgba(0,0,0,0.06)'
  },
  darkBar: {
    backgroundColor: '#0f172a',
    borderBottomColor: 'rgba(255,255,255,0.06)'
  },
  tabGroup: {
    flexDirection: 'row',
    gap: 4
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  activeTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)'
  },
  tabText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  activeTabText: {
    color: '#6366f1'
  },
  categoryFilters: {
    flex: 1,
    flexDirection: 'row',
    maxHeight: 32,
  },
  categoryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    justifyContent: 'center',
    height: 28,
    borderWidth: 1
  },
  lightCategoryBtn: {
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderColor: 'rgba(0,0,0,0.04)'
  },
  darkCategoryBtn: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)'
  },
  activeCategoryBtn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1'
  },
  categoryBtnTxt: {
    fontSize: 10,
    fontWeight: '600'
  },
  activeCategoryBtnTxt: {
    color: '#fff'
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#6366f1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  addBtnTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  formContainer: {
    margin: 16,
    padding: 14,
    gap: 10
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  formInput: {
    height: 38,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 12
  },
  lightInput: {
    backgroundColor: 'rgba(0,0,0,0.01)',
    borderColor: 'rgba(0,0,0,0.08)',
    color: '#000'
  },
  darkInput: {
    backgroundColor: 'rgba(255,255,255,0.01)',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#fff'
  },
  formRow: {
    flexDirection: 'row',
    gap: 12
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 4
  },
  selectBtn: {
    flex: 1,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  selectBtnTxt: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  formButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: 'bold'
  },
  boardColumns: {
    padding: 16,
    gap: 16,
    flexDirection: 'row'
  },
  boardColumn: {
    width: 290,
    flexDirection: 'column',
    gap: 10
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  columnHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  columnLabel: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  columnBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99
  },
  lightBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  darkBadge: {
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  columnBadgeTxt: {
    fontSize: 9,
    fontWeight: 'bold'
  },
  columnCards: {
    gap: 10,
    paddingBottom: 20
  },
  taskCard: {
    width: '100%',
    padding: 12
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  priorityTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  priorityTagTxt: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase'
  },
  categoryTag: {
    fontSize: 10,
    fontWeight: 'bold'
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  dateText: {
    fontSize: 10,
    fontWeight: '500'
  },
  overdueText: {
    color: '#ef4444',
    fontWeight: 'bold'
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8
  },
  moveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  moveBtnTxt: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6366f1'
  },
  deleteLink: {
    fontSize: 10,
    color: '#ef4444',
    fontWeight: 'bold'
  },
  calendarContainer: {
    padding: 16
  },
  calendarCard: {
    width: '100%',
    padding: 16
  },
  calendarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  calendarDesc: {
    fontSize: 11,
    marginBottom: 16
  },
  calendarTimeline: {
    gap: 16
  },
  timelineRow: {
    flexDirection: 'row',
    gap: 12
  },
  timelineTime: {
    width: 60,
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'right',
    paddingTop: 8
  },
  timelineSeparator: {
    alignItems: 'center',
    width: 12
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 10
  },
  timelineLine: {
    flex: 1,
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    minHeight: 40
  },
  timelineCard: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1
  },
  lightTimelineCard: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(0,0,0,0.04)'
  },
  darkTimelineCard: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)'
  },
  timelineCardTxt: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2
  },
  timelineCardCat: {
    fontSize: 9,
    color: '#8e8e93'
  },
  emptyText: {
    fontSize: 11,
    fontStyle: 'italic',
    paddingVertical: 10
  },
  analyticsContainer: {
    padding: 16
  },
  analyticsCard: {
    width: '100%',
    padding: 16
  },
  analyticsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: 'bold'
  },
  analyticsStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  statBox: {
    flex: 1,
    minWidth: 100,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    alignItems: 'center'
  },
  statVal: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  statLbl: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 4
  },
  insightsBox: {
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.06)',
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)'
  },
  insightsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4
  },
  insightsDesc: {
    fontSize: 11,
    lineHeight: 16
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
  },
  nlpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8
  },
  lightNlp: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkNlp: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255,255,255,0.06)'
  },
  nlpInput: {
    flex: 1,
    fontSize: 11,
    height: 32,
    borderWidth: 0,
    outlineWidth: 0 as any
  },
  nlpSubmitBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8
  },
  nlpSubmitText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
export default TaskManager;
