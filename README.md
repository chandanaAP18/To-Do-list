# NeuroBoard

NeuroBoard is a premium, modern AI-powered productivity and task management application. It offers an interactive infinite whiteboard canvas, sticky notes, check-lists, voice command task automation (NLP parsing), Pomodoro session timers, and conversational AI features wrapped in a gorgeous dark glassmorphic interface.

---

## 🛠️ Architecture & Tech Stack

- **Frontend Framework**: React Native + Expo (cross-platform for Web, iOS, and Android)
- **Styling**: Vanilla React Native StyleSheet with Glassmorphism specifications
- **Backend / Database**: Firebase (Auth, Firestore, Cloud Storage, FCM)
- **AI Integrations**: OpenAI API (summaries, plan generation)
- **Speech Processing**: NLP Parsing + Google Speech-to-Text API

---

## 📂 Project Structure

```
neuroboard/
├── App.tsx                     # Root Entrypoint, App Routing & Global States
├── app.json                    # Expo Manifest
├── package.json                # Dependencies Configuration
├── tsconfig.json               # TypeScript Compiler Specs
├── firestore.rules             # Firestore Database Security Rules
├── src/
│   ├── config/
│   │   ├── firebase.ts         # Firebase SDK Init + AsyncStorage Offline Mock Fallback
│   │   └── api.ts              # OpenAI & Speech Services (Live & Mock modes)
│   ├── utils/
│   │   └── nlp.ts              # Natural Language Task Command Extraction
│   ├── components/
│   │   ├── GlassCard.tsx       # Reusable Glassmorphism Styled Container
│   │   ├── BoardCanvas.tsx     # Infinite SVG Drawing Whiteboard Canvas
│   │   ├── StickyNote.tsx      # Draggable, Editable Notes with Checklists & Comments
│   │   ├── AIAssistant.tsx     # Chat Assistant panel & quick actions
│   │   ├── PomodoroTimer.tsx   # Pomodoro widget
│   │   ├── VoiceRecorder.tsx   # Dictation simulation tool
│   │   └── LanguageSelector.tsx# Multilingual localization switcher
│   └── screens/
│       ├── Dashboard.tsx       # Unified widget workspace home
│       ├── Whiteboard.tsx      # Drawing board & sticky board workspace view
│       ├── TaskManager.tsx     # Kanban board, Scheduled list & Analytics Insights
│       └── AuthScreen.tsx      # Login / Registration form & Profile settings
```

---

## 📊 Database Schema (Firestore)

### 1. `users` Collection
Stores registered user information and active profiles.
```typescript
{
  uid: string;           // Document ID matching Auth UID
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;     // ISO Timestamp
  updatedAt: string;
}
```

### 2. `boards` Collection
Stores interactive canvas details.
```typescript
{
  id: string;            // Document ID
  ownerId: string;       // References users.uid
  title: string;
  collaborators: string[]; // List of user emails or UIDs
  elements: Array<{      // Whiteboard drawing vector paths
    id: string;
    type: 'free' | 'rect' | 'circle' | 'line';
    points: string;      // Coordinates "x,y x2,y2 ..."
    color: string;
    size: number;
  }>;
  createdAt: string;
}
```

### 3. `notes` Collection
Sticky notes, text cards, and checklists rendered on the whiteboard.
```typescript
{
  id: string;            // Document ID
  boardId: string;       // References boards.id
  title: string;
  content: string;       // Text content
  type: 'text' | 'checklist';
  color: string;         // Hex code background tag
  pinned: boolean;
  x: number;             // X position on whiteboard canvas
  y: number;             // Y position on whiteboard canvas
  checklist: Array<{     // Checklist items
    id: string;
    text: string;
    done: boolean;
  }>;
  comments: Array<{      // Sticky note comment thread
    id: string;
    user: string;
    text: string;
    time: string;
  }>;
  attachments: string[]; // Image/file URLs
  createdAt: string;
}
```

### 4. `tasks` Collection
Individual planner tasks synced to Kanban columns and the calendar.
```typescript
{
  id: string;            // Document ID
  userId: string;        // References users.uid
  title: string;
  dueDate: string;       // ISO Timestamp
  priority: 'low' | 'medium' | 'high';
  category: string;      // e.g. "Work", "Study", "Personal"
  status: 'todo' | 'in_progress' | 'review' | 'completed';
  completed: boolean;
  createdAt: string;
}
```

---

## 🔒 Firestore Security Rules

To enforce strict role-based access for general tasks and collaboration on shared boards, deploy the following rules in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profile rule
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Tasks: Accessible only by their owner
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }

    // Boards: Accessible by owner or collaborators
    match /boards/{boardId} {
      allow read, write: if request.auth != null && (
        resource.data.ownerId == request.auth.uid || 
        request.auth.token.email in resource.data.collaborators
      );
      allow create: if request.auth != null;
    }

    // Notes: Accessible if the parent board is accessible
    match /notes/{noteId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 Setup & Execution

### Prerequisites
- Install [Node.js](https://nodejs.org) (v18+)
- Active internet connection

### 1. Install dependencies
From the project root directory, run:
```bash
npm install --legacy-peer-deps
```

### 2. Configure Credentials (Optional)
Open `src/config/firebase.ts` and replace placeholders with your Firebase credentials.
Open `src/config/api.ts` and set `useMock: false` alongside your OpenAI and Google API keys.
*Note: The app is equipped with full sandbox simulation mock fallbacks. It will run completely without keys!*

### 3. Launch Development Server
To launch the app inside your local browser:
```bash
npm run web
```
To run on Android/iOS emulators, download the Expo Go app and run:
```bash
npm run android
# or
npm run ios
```
