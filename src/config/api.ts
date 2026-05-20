// API configuration and interfaces for OpenAI and Speech Services
const API_CONFIG = {
  openaiKey: "",
  googleSpeechKey: "",
  useMock: true // Set to false to use live APIs
};

export interface AIResponse {
  text: string;
  suggestedTasks?: Array<{ title: string; dueDate?: string; priority: 'low' | 'medium' | 'high' }>;
}

export const aiService = {
  // Summarize notes
  async summarize(noteText: string): Promise<string> {
    if (API_CONFIG.useMock || !API_CONFIG.openaiKey) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return `[AI Summary] The note discusses details around: "${noteText.slice(0, 40)}...". Key takeaways include resolving primary blocking points, consolidating the list of open items, and checking back tomorrow for next steps.`;
    }
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_CONFIG.openaiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: `Summarize this note in 2 bullet points:\n\n${noteText}` }]
        })
      });
      const data = await response.json();
      return data.choices[0].message.content;
    } catch (e) {
      return "Error calling OpenAI API. Check key.";
    }
  },

  // Generate task list from note
  async generateTasks(noteText: string): Promise<Array<{ title: string; priority: 'low' | 'medium' | 'high' }>> {
    if (API_CONFIG.useMock || !API_CONFIG.openaiKey) {
      await new Promise(resolve => setTimeout(resolve, 800));
      return [
        { title: `Follow up on: ${noteText.slice(0, 30)}...`, priority: 'medium' },
        { title: "Review guidelines and draft plan", priority: 'high' },
        { title: "Sync team on status updates", priority: 'low' }
      ];
    }
    // OpenAI implementation here
    return [];
  },

  // Translate text
  async translate(text: string, targetLang: string): Promise<string> {
    const translations: Record<string, Record<string, string>> = {
      te: { // Telugu
        "Welcome to NeuroBoard": "న్యూరోబోర్డుకు స్వాగతం",
        "Complete project assignment": "ప్రాజెక్ట్ అసైన్‌మెంట్‌ను పూర్తి చేయండి",
        "Call Mom at 8 PM": "రాత్రి 8 గంటలకు అమ్మకు కాల్ చేయండి",
        "Buy groceries": "సరుకులు కొనండి",
        "Meeting notes": "సమావేశ గమనికలు"
      },
      hi: { // Hindi
        "Welcome to NeuroBoard": "न्यूरोबोर्ड में आपका स्वागत है",
        "Complete project assignment": "परियोजना असाइनमेंट पूरा करें",
        "Call Mom at 8 PM": "रात 8 बजे माँ को कॉल करें",
        "Buy groceries": "किराना खरीदें",
        "Meeting notes": "बैठक के नोट्स"
      },
      ta: { // Tamil
        "Welcome to NeuroBoard": "நியூரோபோர்டுக்கு வரவேறுகிறோம்",
        "Complete project assignment": "திட்டப் பணியை முடிக்கவும்",
        "Call Mom at 8 PM": "இரவு 8 மணிக்கு அம்மாவை அழைக்கவும்",
        "Buy groceries": "மளிகை பொருட்கள் வாங்கவும்",
        "Meeting notes": "கூட்டக் குறிப்புகள்"
      },
      kn: { // Kannada
        "Welcome to NeuroBoard": "ನ್ಯೂರೋಬೋರ್ಡ್‌ಗೆ ಸ್ವಾಗತ",
        "Complete project assignment": "ಪ್ರಾಜೆಕ್ಟ್ ನಿಯೋಜನೆಯನ್ನು ಪೂರ್ಣಗೊಳಿಸಿ",
        "Call Mom at 8 PM": "ರಾತ್ರಿ 8 ಗಂಟೆಗೆ ಅಮ್ಮನಿಗೆ ಕರೆ ಮಾಡಿ",
        "Buy groceries": "ದಿನಸಿ ವಸ್ತುಗಳನ್ನು ಖರೀದಿಸಿ",
        "Meeting notes": "ಸಭೆಯ ಟಿಪ್ಪಣಿಗಳು"
      },
      fr: { // French
        "Welcome to NeuroBoard": "Bienvenue sur NeuroBoard",
        "Complete project assignment": "Terminer le devoir de projet",
        "Call Mom at 8 PM": "Appeler Maman à 20h",
        "Buy groceries": "Acheter des provisions",
        "Meeting notes": "Notes de réunion"
      },
      de: { // German
        "Welcome to NeuroBoard": "Willkommen bei NeuroBoard",
        "Complete project assignment": "Projektaufgabe abschließen",
        "Call Mom at 8 PM": "Mama um 20 Uhr anrufen",
        "Buy groceries": "Lebensmittel kaufen",
        "Meeting notes": "Besprechungsnotizen"
      }
    };

    await new Promise(resolve => setTimeout(resolve, 400));
    if (translations[targetLang] && translations[targetLang][text]) {
      return translations[targetLang][text];
    }
    
    // Fallback automatic translation simulation
    return `[Translated to ${targetLang.toUpperCase()}]: ${text}`;
  },

  // Handwriting OCR recognition simulation
  async recognizeHandwriting(pathsCount: number, targetLang: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 900));
    const samples: Record<string, string> = {
      en: "Handwritten Note: Build custom drawing canvas and verify coordinates.",
      te: "చేతివ్రాత గమనిక: కొత్త డ్రాయింగ్ బోర్డ్ రూపకల్పన చేయాలి.",
      hi: "हस्तलिखित नोट: नए ड्राइंग बोर्ड का डिज़ाइन तैयार करें।",
      fr: "Note manuscrite: concevoir un nouveau tableau de dessin.",
      de: "Handschriftliche Notiz: Entwerfen Sie ein neues Zeichenbrett."
    };
    return samples[targetLang] || (samples['en'] + ` [Recognized in ${targetLang.toUpperCase()}]`);
  },

  // Board organizer
  async organizeBoard(notes: any[]): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Sort notes dynamically: group by color or pin status and arrange in a clean grid
    return notes.map((note, index) => {
      const col = index % 3;
      const row = Math.floor(index / 3);
      return {
        ...note,
        x: 50 + col * 320,
        y: 100 + row * 220
      };
    });
  }
};

// Speech services
export const speechService = {
  async transcribeAudio(localAudioUri: string, languageCode: string = 'en-US'): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Standard mock replies depending on voice files
    if (localAudioUri.includes("mock_reminder")) {
      return "remind me tomorrow at 7 PM to complete assignment";
    }
    return "Complete the remaining sections and build the frontend canvas";
  }
};
