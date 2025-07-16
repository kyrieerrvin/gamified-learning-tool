// src/types/index.ts
export interface Challenge {
    id: string;
    type: 'conversation' | 'make-sentence' | 'multiple-choice';
    points: number;
    content: any; // We'll define specific content types later
  }