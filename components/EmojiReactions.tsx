import { useState } from 'react';
import { Smile } from 'lucide-react';
import ErrorBoundary from './ErrorBoundary';

interface EmojiReactionsProps {
  messageId: string;
  currentUserId: string;
  initialReactions?: { [key: string]: string[] };
  onReactionUpdate: (messageId: string, emoji: string, action: 'add' | 'remove') => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😄', '🎉', '🤔', '👀', '🚀', '👏'];

export default function EmojiReactions({ 
  messageId, 
  currentUserId, 
  initialReactions = {}, 
  onReactionUpdate 
}: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [reactions, setReactions] = useState(initialReactions);

  const handleReaction = (emoji: string) => {
    const userReacted = reactions[emoji]?.includes(currentUserId);
    const action = userReacted ? 'remove' : 'add';
    
    onReactionUpdate(messageId, emoji, action);
    
    setReactions(prev => {
      const updated = { ...prev };
      if (!updated[emoji]) updated[emoji] = [];
      
      if (userReacted) {
        updated[emoji] = updated[emoji].filter(id => id !== currentUserId);
        if (updated[emoji].length === 0) delete updated[emoji];
      } else {
        updated[emoji] = [...updated[emoji], currentUserId];
      }
      
      return updated;
    });
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-2">
        <p className="text-red-600">Emoji reactions are currently unavailable.</p>
      </div>
    }>
      <div className="flex items-center space-x-2">
        <ErrorBoundary fallback={
          <div className="p-1">
            <p className="text-yellow-600">Reaction display is unavailable.</p>
          </div>
        }>
          <div className="flex flex-wrap gap-1">
            {Object.entries(reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={`px-2 py-1 rounded-full text-sm ${
                  users.includes(currentUserId)
                    ? 'bg-blue-100 dark:bg-blue-900'
                    : 'bg-gray-100 dark:bg-gray-700'
                } hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors`}
              >
                <span>{emoji}</span>
                <span className="ml-1">{users.length}</span>
              </button>
            ))}
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-1">
            <p className="text-yellow-600">Emoji picker is unavailable.</p>
          </div>
        }>
          <div className="relative">
            <button
              onClick={() => setShowPicker(!showPicker)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <Smile className="w-5 h-5 text-gray-500" />
            </button>

            {showPicker && (
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-4 gap-2">
                  {COMMON_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        handleReaction(emoji);
                        setShowPicker(false);
                      }}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
