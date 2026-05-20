import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from 'react-native';
import { Mic, MicOff, AlertCircle } from 'lucide-react-native';
import { parseNaturalLanguageTask, ParsedTask } from '../utils/nlp';
import GlassCard from './GlassCard';

interface VoiceRecorderProps {
  onTaskCreated: (task: ParsedTask) => void;
  dark?: boolean;
}

const TEMPLATE_COMMANDS = [
  "Remind me tomorrow at 7 PM to complete assignment",
  "Buy groceries study materials tomorrow morning",
  "Urgent meeting with project team on Friday at 4 PM"
];

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onTaskCreated, dark = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [inputText, setInputText] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setStatus("Listening... Speak now.");
  };

  const stopRecording = (mockText?: string) => {
    setIsRecording(false);
    setIsProcessing(true);
    setStatus("Converting speech to text...");

    setTimeout(() => {
      const finalSpeech = mockText || inputText || "Remind me tomorrow at 7 PM to complete assignment";
      setInputText(finalSpeech);
      setIsProcessing(false);
      
      const parsed = parseNaturalLanguageTask(finalSpeech);
      if (parsed) {
        onTaskCreated(parsed);
        setStatus(`Successfully created task: "${parsed.title}" (Due: ${new Date(parsed.dueDate).toLocaleDateString()})`);
      } else {
        setStatus("Could not extract a valid task. Try speaking clearly.");
      }
    }, 1200);
  };

  const handleTemplateClick = (cmd: string) => {
    setInputText(cmd);
    stopRecording(cmd);
  };

  return (
    <GlassCard dark={dark} style={styles.container}>
      <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>Voice Command (Speech-to-Text)</Text>
      
      <View style={styles.recorderRow}>
        <TouchableOpacity
          onPress={isRecording ? () => stopRecording() : startRecording}
          style={[
            styles.micBtn,
            isRecording ? styles.recordingBtn : (dark ? styles.darkMic : styles.lightMic)
          ]}
        >
          {isRecording ? (
            <ActivityIndicator color="#ef4444" size="small" />
          ) : (
            <Mic size={20} color={dark ? "#f3f4f6" : "#1f2937"} />
          )}
        </TouchableOpacity>
        
        <View style={styles.inputContainer}>
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type or dictate command..."
            placeholderTextColor={dark ? "#9ca3af" : "#6b7280"}
            style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
          />
        </View>
      </View>

      {status && (
        <View style={styles.statusBox}>
          <AlertCircle size={14} color="#818cf8" />
          <Text style={[styles.statusText, dark ? styles.darkSub : styles.lightSub]}>{status}</Text>
        </View>
      )}

      <Text style={[styles.subtitle, dark ? styles.darkSub : styles.lightSub]}>Templates (Tap to test voice NLP):</Text>
      <View style={styles.templates}>
        {TEMPLATE_COMMANDS.map((cmd, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => handleTemplateClick(cmd)}
            style={[styles.templateCard, dark ? styles.darkTemplate : styles.lightTemplate]}
          >
            <Text style={[styles.templateText, dark ? styles.darkText : styles.lightText]} numberOfLines={1}>
              "{cmd}"
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    width: '100%'
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12
  },
  recorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  lightMic: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkMic: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255,255,255,0.08)'
  },
  recordingBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444'
  },
  inputContainer: {
    flex: 1,
  },
  input: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  lightInput: {
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderColor: 'rgba(0,0,0,0.08)',
    color: '#1f2937'
  },
  darkInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderColor: 'rgba(255,255,255,0.08)',
    color: '#f3f4f6'
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(129, 140, 248, 0.08)',
    padding: 8,
    borderRadius: 8,
    marginVertical: 6
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500'
  },
  subtitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 6
  },
  templates: {
    gap: 6
  },
  templateCard: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1
  },
  lightTemplate: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: 'rgba(0,0,0,0.04)'
  },
  darkTemplate: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderColor: 'rgba(255,255,255,0.04)'
  },
  templateText: {
    fontSize: 11,
    fontStyle: 'italic'
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
export default VoiceRecorder;
