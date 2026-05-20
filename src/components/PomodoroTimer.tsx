import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react-native';
import GlassCard from './GlassCard';

interface PomodoroTimerProps {
  dark?: boolean;
}

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const MODE_TIMES: Record<TimerMode, number> = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60
};

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ dark = false }) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODE_TIMES.work);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play alert/vibration logic if on native, or sound on web
      if (Platform => true) {
        try {
          const context = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = context.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440, context.currentTime);
          osc.connect(context.destination);
          osc.start();
          osc.stop(context.currentTime + 1);
        } catch (_) {}
      }
      alert(mode === 'work' ? "Work session done! Take a break." : "Break session done! Time to focus.");
      resetTimer();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODE_TIMES[mode]);
  };

  const changeMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    setTimeLeft(MODE_TIMES[newMode]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <GlassCard dark={dark} style={styles.cardContainer}>
      <View style={styles.header}>
        <Flame size={18} color={mode === 'work' ? '#f43f5e' : '#10b981'} />
        <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>
          {mode === 'work' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </Text>
      </View>

      <Text style={[styles.timerText, dark ? styles.darkText : styles.lightText]}>
        {formatTime(timeLeft)}
      </Text>

      <View style={styles.tabs}>
        {(['work', 'shortBreak', 'longBreak'] as TimerMode[]).map(m => (
          <TouchableOpacity
            key={m}
            onPress={() => changeMode(m)}
            style={[
              styles.tab,
              mode === m && (dark ? styles.darkActiveTab : styles.lightActiveTab)
            ]}
          >
            <Text style={[
              styles.tabText,
              mode === m ? styles.activeTabText : (dark ? styles.darkSub : styles.lightSub)
            ]}>
              {m === 'work' ? 'Work' : m === 'shortBreak' ? 'Short' : 'Long'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleTimer} style={styles.mainControlBtn}>
          {isActive ? (
            <Pause size={20} color="#fff" />
          ) : (
            <Play size={20} color="#fff" />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={resetTimer} style={[styles.resetBtn, dark ? styles.darkReset : styles.lightReset]}>
          <RotateCcw size={16} color={dark ? '#f3f4f6' : '#1f2937'} />
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
    fontFamily: 'System',
    letterSpacing: 2,
    marginVertical: 10
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16
  },
  tab: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  lightActiveTab: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
  },
  darkActiveTab: {
    backgroundColor: 'rgba(129, 140, 248, 0.2)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600'
  },
  activeTabText: {
    color: '#6366f1'
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  mainControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    shadowOpacity: 0.3
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1
  },
  lightReset: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkReset: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255,255,255,0.08)'
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
export default PomodoroTimer;
