# AlzCare Patient Mobile Application

A dedicated, accessible React Native + Expo mobile application designed specifically for Alzheimer's and cognitive impairment patients. The mobile application seamlessly connects to the existing AlzCare medical backend and shared MongoDB database, enabling real-time care synchronization between doctor web dashboard and patient mobile app.

---

## 🌟 Key Features

1. **Splash & Secure Authentication**:
   - Patient-only role verification (doctors are routed to the Web Dashboard).
   - Secure token storage with persistent sessions (`AsyncStorage`).
   - One-tap demo login helper for immediate testing.
2. **Accessible Cognitive UI/UX**:
   - High-contrast, clean dark theme tailored for cognitive clarity and visual comfort.
   - Large buttons with touch targets (≥ 48dp) and readable typography (≥ 16sp body).
   - Minimal clutter and simplified navigation.
3. **Interactive Cognitive Exercises**:
   - **Memory Match**: Card pair matching testing working memory and retention.
   - **Visual Search**: Timed target symbol identification evaluating visual attention and scanning.
   - **Speed Tap**: Sensor reaction game measuring motor speed, focus, and response latency.
   - **Pattern Sequence**: Progressive colored sequence reproduction testing short-term sequential recall.
4. **Doctor-Patient Assignment Synchronization**:
   - Doctor assigns exercises with custom frequency (Daily, Weekly), repetitions, and difficulty (Easy, Medium, Hard).
   - Mobile app highlights new assignments with prominent badges and priority banners.
5. **Real-Time Scoring & Progress Analytics**:
   - Submits game results directly to `POST /api/games/result` with score, accuracy, completion time, and moves.
   - Tracks best score, average score, total attempts, and completion rates.
   - Real-time updates appear immediately on the Doctor's Web Dashboard under **Cognitive Game Progress**.
6. **Clinical Appointments**:
   - View scheduled and past consultations with assigned neurologists.
   - In-app consultation booking with preferred date, time slot, and clinical notes.
7. **Physician Information**:
   - Direct view of assigned doctor, specialization, contact channels, and care mission.
8. **Patient Medical Profile & Notifications**:
   - View patient ID, age, gender, emergency caregiver contacts, and in-app clinical alerts.

---

## 📱 Architecture

```
Doctor Web Dashboard (Next.js :3000)
            │
            ▼ (REST API)
   Existing Node.js Backend (:5000)
            │
            ▼ (Mongoose ODM)
   Shared MongoDB Database (:27017 / alzcare)
            │
            ▲ (REST API / Bearer JWT)
Patient Mobile App (React Native Expo)
```

---

## 🛠️ Environment Configuration

Create or verify `.env` in `patient-app/`:

```env
# Use your computer's local network IP for physical Android/iOS Expo devices
# For Android Emulator on the same machine, you can also use http://10.0.2.2:5000/api
EXPO_PUBLIC_API_URL=http://192.168.1.5:5000/api
```

> **Note**: Do NOT use `localhost` when testing on a physical mobile device because `localhost` refers to the mobile phone itself. Use your machine's Wi-Fi IPv4 address (e.g., `192.168.1.5`).

---

## 🚀 Running the Patient Mobile App

### 1. Prerequisites
- Node.js (v18+)
- Backend running on `http://192.168.1.5:5000`
- Expo Go app installed on your Android/iOS device (from Google Play Store / App Store)

### 2. Install Dependencies
```bash
cd patient-app
npm install
```

### 3. Start Expo Dev Server
```bash
npx expo start
```

### 4. Open on Physical Android Device
1. Make sure your Android phone and development computer are connected to the **same Wi-Fi network**.
2. Open the **Expo Go** app on your Android phone.
3. Scan the QR code displayed in your terminal.
4. The app will bundle and load the AlzCare Patient Mobile App!

### 5. Running on Android Emulator / Web
- **Android Emulator**: Press `a` in the Expo terminal.
- **Web Preview**: Press `w` in the Expo terminal.

---

## 🧪 Testing the Complete Doctor ↔ Patient Flow

1. **Doctor assigns game**:
   - Log in to Web Dashboard at `http://localhost:3000` as a Doctor.
   - Navigate to Patients -> Select patient (e.g. `lucky123@gmail.com`).
   - In "Assign Cognitive Exercise", choose **Memory Match**, difficulty **Medium**, frequency **Daily**, and click **Assign Game**.
2. **Patient receives & plays on mobile**:
   - Open Patient Mobile App -> Sign in with `lucky123@gmail.com` / `123456`.
   - On the Home screen or Exercises tab, see **Memory Match** with an **ASSIGNED** badge.
   - Tap **Play Now**, complete the memory exercise.
   - Tap **Complete Exercise** to record the score.
3. **Doctor sees updated progress**:
   - Refresh the patient's page in the Doctor Web Dashboard.
   - The **Cognitive Game Progress** section instantly reflects the updated completion count, average score, best score, and last played timestamp.
