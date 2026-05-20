import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type LanguageCode = 'en' | 'te' | 'hi' | 'ta' | 'kn' | 'fr' | 'de';

interface LanguageSelectorProps {
  currentLang: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  dark?: boolean;
}

export const LANGUAGES: Record<LanguageCode, { label: string; nativeName: string }> = {
  en: { label: 'English', nativeName: 'English' },
  te: { label: 'Telugu', nativeName: 'తెలుగు' },
  hi: { label: 'Hindi', nativeName: 'हिन्दी' },
  ta: { label: 'Tamil', nativeName: 'தமிழ்' },
  kn: { label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  fr: { label: 'French', nativeName: 'Français' },
  de: { label: 'German', nativeName: 'Deutsch' }
};

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLang, onLanguageChange, dark = false }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, dark ? styles.darkText : styles.lightText]}>System Language</Text>
      <View style={styles.grid}>
        {(Object.keys(LANGUAGES) as LanguageCode[]).map((key) => {
          const isSelected = currentLang === key;
          return (
            <TouchableOpacity
              key={key}
              style={[
                styles.button,
                dark ? styles.darkBtn : styles.lightBtn,
                isSelected && (dark ? styles.darkSelectedBtn : styles.lightSelectedBtn)
              ]}
              onPress={() => onLanguageChange(key)}
            >
              <Text style={[styles.btnText, isSelected ? styles.selectedText : (dark ? styles.darkText : styles.lightText)]}>
                {LANGUAGES[key].nativeName}
              </Text>
              <Text style={styles.subtext}>
                {LANGUAGES[key].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    width: '100%'
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'System'
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'all',
    transitionDuration: '200ms'
  },
  lightBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(0,0,0,0.06)'
  },
  darkBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255,255,255,0.08)'
  },
  lightSelectedBtn: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1'
  },
  darkSelectedBtn: {
    backgroundColor: '#818cf8',
    borderColor: '#818cf8'
  },
  btnText: {
    fontSize: 13,
    fontWeight: 'bold'
  },
  subtext: {
    fontSize: 10,
    color: '#8e8e93',
    marginTop: 2
  },
  lightText: {
    color: '#1f2937'
  },
  darkText: {
    color: '#f3f4f6'
  },
  selectedText: {
    color: '#ffffff'
  }
});
export default LanguageSelector;
