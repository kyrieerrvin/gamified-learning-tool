# TagalogLearn: Gamified Tagalog Learning Platform

A fun and interactive web application for learning Tagalog through gamified challenges and exercises. Built with Next.js, React, Firebase, and the calamancy NLP model for Tagalog language processing.

## 🌟 Features

- **Three Learning Modes**:
  - **AI Conversation** - Practice real-world dialogues with context-aware feedback
  - **Make a Sentence** - Create meaningful sentences with Tagalog words and phrases
  - **Parts of a Sentence** - Test your knowledge with adaptive quizzes generated by NLP

- **Progress Tracking**:
  - Daily streak tracking
  - Score and point system
  - Performance analytics and statistics
  - Persistent user progress via Firebase Firestore

- **User Authentication**:
  - Email and password login
  - Google authentication
  - Secure user profiles
 
## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn
- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/tagalog-learn.git
   cd tagalog-learn
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install Python backend dependencies:
   ```bash
   pip install calamancy flask flask-cors
   ```

### Starting the Application

You can start the application using our convenient scripts:

#### Option 1: All-in-one launcher (recommended)

Run the following command to check dependencies, start the NLP API, and launch the Next.js frontend:

```bash
./start-nlp.sh && npm run dev
```

#### Option 2: Start components separately

1. Start the NLP API:
   ```bash
   ./start-nlp.sh 
   ```

2. In a new terminal, start the Next.js development server:
   ```bash
   npm run dev
   ```

3. Open your browser and visit: `http://localhost:3000`

### Testing the NLP Integration

To verify that the CalamanCy NLP model is working correctly:

1. First validate that the model loads correctly:
   ```bash
   python test-nlp.py
   ```

2. Test the connection between frontend and backend:
   ```bash
   python test-connection.py
   ```

3. Once the application is running, navigate to the Parts of Speech game:
   `http://localhost:3000/challenges/multiple-choice`

4. Check if the game shows "AI Analysis" instead of "Basic Analysis" in the UI.

### Troubleshooting

If you encounter issues:

1. **Connection errors** (like "Proxying NLP test request to http://localhost:6000/api/test-pos" or "fetch failed"):
   - Make sure you're using the updated code (we've fixed port inconsistencies)
   - Kill any stray processes and restart:
     ```bash
     lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9
     pkill -f "python.*app.py"
     ```

2. **NLP API issues**:
   - Check if the API is running: `curl http://localhost:5000/health`
   - Verify CalamanCy installation: `python test-nlp.py`
   - Test API connections: `python test-connection.py`

3. **Model loading problems**:
   - If model loading fails, the API will automatically fall back to a dictionary-based approach
   - Check if the UI shows "AI Analysis" or "Basic Analysis" to identify which processing method is active

4. **Port conflicts**:
   - The start script will automatically attempt to kill processes using port 5000
   - If problems persist, manually verify no processes are using the required ports

### Project Structure

The project is organized into a clear, modular structure:

```
src/
├── api/            # Backend API route handlers
├── app/            # Next.js app router 
│   └── api/        # API routes implementation
├── components/     # UI components
│   ├── challenges/ # Challenge-specific components
│   ├── common/     # Shared components
│   ├── layout/     # Layout components
│   └── ui/         # UI elements
├── data/           # Data layer
│   ├── mock/       # Mock/fallback data
│   └── models/     # Type definitions
├── lib/            # Configuration and utilities
├── services/       # Business logic
│   ├── game/       # Game mechanics
│   └── nlp/        # NLP functionality
├── store/          # State management
├── types/          # Global type definitions
└── utils/          # Utility functions
```

Key architectural features:
- Clear separation of concerns between data, services, and UI
- Centralized type definitions to reduce duplication
- Dedicated mock data directory for fallback scenarios
- Modular service layer with focused responsibilities

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python Flask API with calamancy NLP model
- **Authentication**: Firebase Authentication
- **State Management**: Zustand
- **Data Storage**: Firebase Firestore

## NLP Integration Details

### Architecture

The NLP integration consists of two main components:

1. **Dedicated NLP API Server** (`app.py`)
   - Flask-based RESTful API for NLP processing
   - Loads the CalamanCy model for Tagalog language analysis
   - Provides endpoints for game data, POS tagging, and answer verification

2. **Next.js Frontend** (via `nlpService.ts`)
   - Communicates with the NLP API through client services
   - Provides fallback mechanisms when the API is unavailable

### API Endpoints

The NLP API provides the following endpoints:

- **GET `/health`** - Health check endpoint
- **GET `/api/pos-game?difficulty=medium`** - Generate game data with optional difficulty parameter
- **POST `/api/analyze`** - Analyze a Tagalog sentence for POS tagging
- **POST `/api/verify`** - Verify if a selected answer is correct

### Fallback Mechanism

The system includes multi-level fallbacks:
1. Try to use dedicated NLP API with CalamanCy model
2. If model fails, use dictionary-based approach in the NLP API
3. If NLP API is unreachable, fall back to hardcoded data in the frontend

### Technical Notes

- The Python backend runs on port 5000 by default
- The NLP API writes its port to `/tmp/nlp_api_port.txt` for the frontend to discover
- The CalamanCy model needs 1-2GB RAM and may take 10-15 seconds to load initially

## Firebase Integration

### Authentication

The application uses Firebase Authentication to manage user accounts:
- Email and password authentication
- Google sign-in integration
- Secure token management

### Firestore Data Model

User data is stored in Firebase Firestore using the following structure:

- **users/{userId}** - Main user document
  - Basic profile information (displayName, email, photoURL)
  - progress - User progress data:
    - totalScore - Total points earned
    - level - Current user level
    - nextLevelPoints - Points needed for next level
    - streakDays - Current streak of consecutive days
    - challengesCompleted - Total number of completed challenges
    - completedChallenges - Counts by challenge type
  - achievements - Array of earned achievements
  - recentChallenges - Recently completed challenges
  - preferences - User preferences and settings
  
  - **challengeResults/{resultId}** - Subcollection of challenge results
    - challengeType - Type of challenge
    - score - Points earned
    - completedAt - Timestamp
    - duration - Time taken to complete

### Security Rules

The application uses Firestore Security Rules to ensure that:
- Users can only read and write their own data
- Challenge results are immutable once created
- Admin functions are protected

### User Context

The `UserContext` provides access to user data throughout the application:
- Use the `useUser()` hook to access user data and functions
- Updates are automatically synchronized with Firestore
- Challenge results are tracked and stored in real-time

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For the Python backend, you can deploy to platforms like:
- Heroku
- Google Cloud Run
- AWS Lambda

Remember to update the `NEXT_PUBLIC_CALAMANCY_API_URL` environment variable to point to your deployed Python backend.