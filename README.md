# TagalogLearn: Gamified Tagalog Learning Platform

A fun and interactive web application for learning Tagalog through gamified challenges and exercises. Built with Next.js, React, and Firebase.

## 🌟 Features

- **Three Learning Modes**:
  - **AI Conversation** - Practice real-world dialogues with context-aware feedback
  - **Make a Sentence** - Create meaningful sentences with Tagalog words and phrases
  - **Parts of a Sentence** - Test your knowledge with adaptive quizzes

- **Progress Tracking**:
  - Daily streak tracking
  - Score and point system
  - Performance analytics and statistics

- **User Authentication**:
  - Email and password login
  - Google authentication
  - Secure user profiles
 
## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm or yarn

### Project Structure
├── public/               # Static assets (SVG files, etc.)
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── challenges/   # Challenge pages
│   │   ├── dashboard/    # User dashboard
│   │   ├── login/        # Authentication pages
│   │   ├── profile/      # User profile
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   └── providers.tsx # Context providers wrapper
│   ├── components/       # React components
│   │   ├── challenges/   # Challenge-specific components
│   │   ├── layout/       # Layout components (Navbar, Header)
│   │   └── ui/           # Reusable UI components (Button)
│   ├── context/          # React context providers
│   │   └── AuthContext.tsx # Authentication context
│   ├── lib/              # Utility functions
│   │   └── firebase.ts   # Firebase configuration
│   ├── store/            # Zustand state management
│   │   └── gameStore.ts  # Game state store
│   └── types/            # TypeScript type definitions
├── tailwind.config.ts    # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── next.config.ts        # Next.js configuration

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
