import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, PanResponder, Animated, Platform } from 'react-native';
import { Pin, Trash2, Languages, Image, MessageSquare, Plus, CheckSquare, Square } from 'lucide-react-native';
import { aiService } from '../config/api';

export interface Comment {
  id: string;
  user: string;
  text: string;
  time: string;
}

export interface NoteData {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'checklist';
  checklist: Array<{ id: string; text: string; done: boolean }>;
  color: string;
  pinned: boolean;
  x: number;
  y: number;
  comments: Comment[];
  attachments: string[];
}

interface StickyNoteProps {
  note: NoteData;
  onUpdate: (id: string, updated: Partial<NoteData>) => void;
  onDelete: (id: string) => void;
  dark?: boolean;
}

const COLORS = [
  '#fef08a', // Yellow
  '#fecdd3', // Red/Pink
  '#bbf7d0', // Green
  '#bfdbfe', // Blue
  '#e9d5ff', // Purple
  '#f3f4f6', // Neutral Grey
];

export const StickyNote: React.FC<StickyNoteProps> = ({ note, onUpdate, onDelete, dark = false }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [newCheckItem, setNewCheckItem] = useState("");

  // Position animated values
  const pan = useRef(new Animated.ValueXY({ x: note.x, y: note.y })).current;

  // Track the actual current position
  const positionRef = useRef({ x: note.x, y: note.y });

  // PanResponder to handle drag & drop
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only drag if not editing inputs
        const targetTagName = (evt.target as any)?.tagName?.toLowerCase();
        if (targetTagName === 'input' || targetTagName === 'textarea' || targetTagName === 'button') {
          return false;
        }
        return true;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: positionRef.current.x,
          y: positionRef.current.y
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();
        positionRef.current = {
          x: positionRef.current.x + gestureState.dx,
          y: positionRef.current.y + gestureState.dy
        };
        onUpdate(note.id, { x: positionRef.current.x, y: positionRef.current.y });
      }
    })
  ).current;

  const handleTranslate = async (lang: 'te' | 'hi' | 'ta' | 'kn' | 'en') => {
    if (note.content) {
      const translated = await aiService.translate(note.content, lang);
      onUpdate(note.id, { content: translated });
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Math.random().toString(),
        user: "You",
        text: newComment.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      onUpdate(note.id, { comments: [...(note.comments || []), comment] });
      setNewComment("");
    }
  };

  const handleAddCheckItem = () => {
    if (newCheckItem.trim()) {
      const newItem = { id: Math.random().toString(), text: newCheckItem.trim(), done: false };
      onUpdate(note.id, { checklist: [...(note.checklist || []), newItem] });
      setNewCheckItem("");
    }
  };

  const toggleCheckItem = (itemId: string) => {
    const list = (note.checklist || []).map(item =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdate(note.id, { checklist: list });
  };

  const addMockAttachment = () => {
    const attachments = [...(note.attachments || []), `https://picsum.photos/seed/${note.id}/300/200`];
    onUpdate(note.id, { attachments });
  };

  return (
    <Animated.View
      style={[
        styles.noteCard,
        pan.getLayout(),
        {
          backgroundColor: note.color,
          shadowColor: note.color
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Drag & Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => onUpdate(note.id, { pinned: !note.pinned })}>
          <Pin size={16} color={note.pinned ? '#6366f1' : '#4b5563'} fill={note.pinned ? '#6366f1' : 'transparent'} />
        </TouchableOpacity>
        
        {/* Color Palette Select */}
        <View style={styles.colorPalette}>
          {COLORS.map(c => (
            <TouchableOpacity
              key={c}
              onPress={() => onUpdate(note.id, { color: c })}
              style={[styles.colorDot, { backgroundColor: c }, note.color === c && styles.activeColorDot]}
            />
          ))}
        </View>

        <TouchableOpacity onPress={() => onDelete(note.id)}>
          <Trash2 size={16} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <TextInput
        value={note.title}
        onChangeText={(val) => onUpdate(note.id, { title: val })}
        placeholder="Note Title"
        placeholderTextColor="#6b7280"
        style={styles.titleInput}
      />

      {/* Body Content */}
      {note.type === 'text' ? (
        <TextInput
          value={note.content}
          onChangeText={(val) => onUpdate(note.id, { content: val })}
          placeholder="Start typing your ideas..."
          placeholderTextColor="#6b7280"
          multiline
          style={styles.contentInput}
        />
      ) : (
        <View style={styles.checklistContainer}>
          {(note.checklist || []).map(item => (
            <TouchableOpacity key={item.id} onPress={() => toggleCheckItem(item.id)} style={styles.checkItemRow}>
              {item.done ? (
                <CheckSquare size={16} color="#6366f1" />
              ) : (
                <Square size={16} color="#4b5563" />
              )}
              <Text style={[styles.checkText, item.done && styles.checkDoneText]}>
                {item.text}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.addCheckRow}>
            <TextInput
              value={newCheckItem}
              onChangeText={setNewCheckItem}
              placeholder="Add check item..."
              placeholderTextColor="#6b7280"
              style={styles.smallInput}
            />
            <TouchableOpacity onPress={handleAddCheckItem} style={styles.iconBtn}>
              <Plus size={16} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Attachments */}
      {note.attachments && note.attachments.length > 0 && (
        <View style={styles.attachmentsContainer}>
          <Text style={styles.attachmentLabel}>Attachments ({note.attachments.length}):</Text>
          {Platform.OS === 'web' ? (
            <img src={note.attachments[0]} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginTop: 4 }} alt="Attachment" />
          ) : (
            <View style={{ height: 80, width: '100%', backgroundColor: '#d1d5db', borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 10 }}>[Attachment Image Loaded]</Text>
            </View>
          )}
        </View>
      )}

      {/* Action Footer */}
      <View style={styles.footer}>
        <View style={styles.translationTrigger}>
          <Languages size={14} color="#4b5563" style={{ marginRight: 4 }} />
          <Text style={styles.footerLabel}>Translate:</Text>
          <View style={styles.langSelectorRow}>
            {(['en', 'te', 'hi', 'ta', 'kn'] as const).map(l => (
              <TouchableOpacity key={l} onPress={() => handleTranslate(l)}>
                <Text style={styles.langLink}>{l.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.footerButtons}>
          <TouchableOpacity onPress={addMockAttachment} style={styles.footerAction}>
            <Image size={14} color="#4b5563" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowComments(!showComments)} style={styles.footerAction}>
            <MessageSquare size={14} color="#4b5563" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Drawer */}
      {showComments && (
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>
          {(note.comments || []).map(cmt => (
            <View key={cmt.id} style={styles.commentCard}>
              <Text style={styles.commentUser}>{cmt.user} • {cmt.time}</Text>
              <Text style={styles.commentText}>{cmt.text}</Text>
            </View>
          ))}
          <View style={styles.addCommentRow}>
            <TextInput
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add comment..."
              placeholderTextColor="#6b7280"
              style={styles.commentInput}
            />
            <TouchableOpacity onPress={handleAddComment} style={styles.commentBtn}>
              <Text style={styles.commentBtnText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  noteCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 290,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    elevation: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    shadowOpacity: 0.1,
    zIndex: 10,
    cursor: 'move' as any,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  colorPalette: {
    flexDirection: 'row',
    gap: 4
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  activeColorDot: {
    borderColor: '#000',
    transform: [{ scale: 1.2 }]
  },
  titleInput: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: 4
  },
  contentInput: {
    fontSize: 13,
    color: '#374151',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 4,
  },
  checklistContainer: {
    marginVertical: 4
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 3
  },
  checkText: {
    fontSize: 13,
    color: '#374151'
  },
  checkDoneText: {
    textDecorationLine: 'line-through',
    color: '#9ca3af'
  },
  addCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  smallInput: {
    flex: 1,
    height: 28,
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.4)'
  },
  iconBtn: {
    padding: 6
  },
  attachmentsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 6
  },
  attachmentLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.04)',
    paddingTop: 8
  },
  translationTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4b5563',
    marginRight: 6
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 4
  },
  langLink: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6366f1'
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8
  },
  footerAction: {
    padding: 4
  },
  commentsSection: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)'
  },
  commentsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 6
  },
  commentCard: {
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.02)',
    paddingBottom: 4
  },
  commentUser: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#6366f1'
  },
  commentText: {
    fontSize: 11,
    color: '#4b5563'
  },
  addCommentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6
  },
  commentInput: {
    flex: 1,
    height: 28,
    fontSize: 11,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    backgroundColor: '#fff'
  },
  commentBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8
  },
  commentBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold'
  }
});
export default StickyNote;
