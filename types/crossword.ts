export type Difficulty = 'easy' | 'medium' | 'hard';

export interface CrosswordClue {
  word: string;
  clue: string;
  difficulty: Difficulty;
}

export interface DatamuseWord {
  word: string;
  score: number;
  tags?: string[];
  defs?: string[];
} 