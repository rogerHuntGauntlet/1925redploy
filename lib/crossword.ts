import { CrosswordClue, Difficulty } from '@/types/crossword';

const DATAMUSE_BASE_URL = 'https://api.datamuse.com';

interface DatamuseWord {
  word: string;
  score: number;
  defs?: string[];
  tags?: string[];
}

// Complex words that are good for hard riddles
const WORD_CATEGORIES = [
  'philosophy', 'astronomy', 'mythology', 'psychology',
  'quantum', 'paradox', 'metaphor', 'enigma'
];

async function getRandomWord(): Promise<DatamuseWord> {
  const category = WORD_CATEGORIES[Math.floor(Math.random() * WORD_CATEGORIES.length)];
  
  // Get words related to the category
  const response = await fetch(
    `${DATAMUSE_BASE_URL}/words?ml=${category}&md=d&max=50`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch random word');
  }

  const words: DatamuseWord[] = await response.json();
  // Filter for longer, more complex words
  const validWords = words.filter(w => 
    w.defs && 
    w.defs.length > 0 && 
    w.word.length >= 7 && // Only longer words
    !w.word.includes(' ') // Exclude phrases
  );

  if (validWords.length === 0) {
    throw new Error('No valid words found');
  }

  return validWords[Math.floor(Math.random() * validWords.length)];
}

async function getWordAssociations(word: string): Promise<DatamuseWord[]> {
  const response = await fetch(
    `${DATAMUSE_BASE_URL}/words?rel_trg=${word}&md=d&max=10`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch word associations');
  }

  return response.json();
}

function generateClue(word: string, wordData: DatamuseWord, associations: DatamuseWord[]): string {
  const definition = wordData.defs?.[0]?.split('\t')[1] || '';
  
  // More cryptic clue types for hard difficulty
  const clueTypes = [
    // Cryptic definition clue
    () => {
      const words = definition.split(' ')
        .filter(w => w.length > 4) // Use longer words for more complexity
        .sort(() => Math.random() - 0.5)
        .slice(0, 2)
        .join(' ');
      return `Ponder this: ${words}`;
    },
    // Abstract association clue
    () => {
      const relatedWords = associations
        .slice(0, 2)
        .map(w => w.word)
        .join(' meets ');
      return `Where ${relatedWords} converge`;
    },
    // Pattern clue
    () => {
      const pattern = word.split('')
        .map((char, i) => i % 2 === 0 ? char : '_')
        .join('');
      return `Complete the pattern: ${pattern}`;
    },
    // Riddle-style clue
    () => {
      const parts = definition.split(' ').filter(w => w.length > 3);
      if (parts.length >= 3) {
        return `I am ${parts[0]}, yet ${parts[1]}. What force of ${parts[2]} am I?`;
      }
      return null;
    }
  ];

  // Try clue types in random order until one works
  const shuffledClueTypes = clueTypes.sort(() => Math.random() - 0.5);
  for (const clueType of shuffledClueTypes) {
    const clue = clueType();
    if (clue) return clue;
  }

  // Fallback clue
  return `Decipher this essence: ${definition}`;
}

export async function generateCrosswordClue(): Promise<CrosswordClue> {
  try {
    const wordData = await getRandomWord();
    const associations = await getWordAssociations(wordData.word);
    const clue = generateClue(wordData.word, wordData, associations);

    return {
      word: wordData.word.toLowerCase(),
      clue,
      difficulty: 'hard' as const
    };
  } catch (error) {
    console.error('Error generating crossword clue:', error);
    // Hard fallback riddles
    const fallbackRiddles: CrosswordClue[] = [
      {
        word: 'paradox',
        clue: "I am true when false, and false when true. What contradiction am I?",
        difficulty: 'hard'
      },
      {
        word: 'quantum',
        clue: "I exist and don't exist until you look for me. In uncertainty I thrive. What am I?",
        difficulty: 'hard'
      },
      {
        word: 'metaphor',
        clue: "I speak in parallels, dancing between worlds of meaning. Through me, mountains become challenges and life becomes a journey. What am I?",
        difficulty: 'hard'
      }
    ];
    return fallbackRiddles[Math.floor(Math.random() * fallbackRiddles.length)];
  }
} 