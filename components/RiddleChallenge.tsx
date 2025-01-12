'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Star, Timer } from 'lucide-react';

type Difficulty = 'easy' | 'medium' | 'hard';

export default function RiddleChallenge() {
  const [riddle, setRiddle] = useState('');
  const [answer, setAnswer] = useState('');
  const [attempts, setAttempts] = useState(3);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [promotionCode, setPromotionCode] = useState('');
  const [showChallenge, setShowChallenge] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('hard');
  const [timeLeft, setTimeLeft] = useState(5);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      // Time's up - reset the riddle
      setAnswer('');
      setError('Time\'s up! Here\'s a new riddle.');
      startChallenge();
      setTimeLeft(5);
    }
    return () => clearTimeout(timer);
  }, [timeLeft, timerActive]);

  const startChallenge = async () => {
    try {
      setLoading(true);
      setError('');
      setTimerActive(false);
      setTimeLeft(5);
      const response = await fetch('/api/get-riddle');
      if (!response.ok) throw new Error('Failed to get riddle');
      const data = await response.json();
      setRiddle(data.clue);
      setDifficulty(data.difficulty);
      setMaxAttempts(data.maxAttempts);
      setAttempts(data.maxAttempts);
      setShowChallenge(true);
      setTimerActive(true);
    } catch (error) {
      setError('Failed to start challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    try {
      setLoading(true);
      setError('');
      setTimerActive(false);
      const response = await fetch('/api/verify-riddle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      
      if (!response.ok) throw new Error('Unable to verify answer. Please try again in a few moments.');
      
      const data = await response.json();
      if (data.correct) {
        setPromotionCode(data.promotionCode);
      } else {
        setAttempts(data.attemptsRemaining);
        setError(`Incorrect answer. You have ${data.attemptsRemaining} ${data.attemptsRemaining === 1 ? 'attempt' : 'attempts'} remaining. Take your time and think carefully!`);
        setAnswer('');
        if (data.attemptsRemaining === 0) {
          // Reset the challenge with a new riddle after a short delay
          setTimeout(() => {
            startChallenge();
          }, 1500);
        } else {
          setTimeLeft(5);
          setTimerActive(true);
        }
      }
    } catch (error) {
      setError('We encountered an issue verifying your answer. Please wait a moment and try again. If the problem persists, refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 'text-green-500';
      case 'medium': return 'text-yellow-500';
      case 'hard': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getDifficultyStars = (diff: Difficulty) => {
    switch (diff) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 0;
    }
  };

  if (promotionCode) {
    return (
      <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
        <p className="mb-4">You've solved the {difficulty} riddle! Here's your promotion code:</p>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-4 font-mono text-lg">
          {promotionCode}
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter this code at checkout for free lifetime access!
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      {!showChallenge ? (
        <button
          onClick={startChallenge}
          disabled={loading}
          className="group inline-flex items-center px-6 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
        >
          {loading ? 'Loading...' : (
            <>
              Solve Riddle for Free Access
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      ) : (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className={`font-medium ${getDifficultyColor(difficulty)}`}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </span>
              <span className="flex gap-0.5 ml-2">
                {[...Array(getDifficultyStars(difficulty))].map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${getDifficultyColor(difficulty)} fill-current`} />
                ))}
              </span>
            </div>
            <div className="flex items-center justify-center mb-4">
              <Timer className="w-5 h-5 mr-2 text-yellow-500" />
              <span className={`font-bold ${timeLeft <= 2 ? 'text-red-500' : 'text-yellow-500'}`}>
                {timeLeft}s
              </span>
            </div>
            <h3 className="text-xl font-bold mb-4">Solve this riddle:</h3>
            <p className="text-lg mb-6">{riddle}</p>
            <div className="space-y-4">
              <input
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer..."
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading || timeLeft === 0}
              />
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <button
                onClick={submitAnswer}
                disabled={loading || !answer.trim() || timeLeft === 0}
                className="w-full px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300 disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Submit Answer'}
              </button>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Attempts remaining: {attempts} of {maxAttempts}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 