# CLAUDE.md - Development Guide

## Commands
```bash
# Development
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint

# Python server (for API)
# Install Python dependencies first: pip install calamancy flask flask-cors
python server.py   # Run Python backend on port 6000
```

## Project Organization
This is a Gamified Learning Tool for Tagalog language, similar to Duolingo but specifically for Tagalog. It uses an NLP model (calamancy) for generating interactive language challenges.

## Code Style Guidelines
- **TypeScript**: Use strict typing with interfaces defined in `src/types/`
- **Imports**: Use `@/` path alias for src imports (e.g., `import Button from '@/components/ui/Button'`)
- **Components**: 
  - Functional components with explicit return types
  - Props interfaces defined above components
- **State Management**: Zustand for global state, React hooks for component state
- **Error Handling**: Try/catch blocks with structured error responses
- **API Routes**: Standard response format `{ success: boolean, data?: any, error?: string }`
- **File Structure**:
  - Components by feature in `src/components/`
  - Reusable UI in `src/components/ui/`
  - Pages in `src/app/` (Next.js App Router)
  - Firebase services in `src/lib/`

## Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Python Flask API with calamancy NLP model
- **Authentication**: Firebase
- **State Management**: Zustand
- **Data Storage**: Firebase

## Running the Application
1. Start the Python backend: `python server.py`
2. Start the Next.js frontend: `npm run dev`
3. Access the application at: http://localhost:3000