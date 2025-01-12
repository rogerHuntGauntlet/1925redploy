import React, { useState } from 'react';
import Message from './Message';
import { Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MessageType } from '@/types/database'
import ErrorBoundary from './ErrorBoundary';

interface ThreadViewProps {
  parentMessage: MessageType;
  replies: MessageType[];
  currentUser: {
    id: string;
    email: string;
  };
  onReply: (messageId: string, replyText: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onClose: () => void;
}

const ThreadView: React.FC<ThreadViewProps> = ({
  parentMessage,
  replies = [],
  currentUser,
  onReply,
  onReaction,
  onClose,
}) => {
  const [replyText, setReplyText] = useState('');

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim()) {
      onReply(parentMessage.id, replyText.trim());
      setReplyText('');
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className="p-4">
        <p className="text-red-600">Unable to load thread view. Please try again later.</p>
      </div>
    }>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Thread</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <ErrorBoundary fallback={
          <div className="flex-1 p-4">
            <p className="text-yellow-600">Unable to load thread messages.</p>
          </div>
        }>
          <div className="flex-1 overflow-y-auto p-4">
            <Message message={parentMessage} isThreadView />
            <div className="mt-4 space-y-4">
              {replies.map(reply => (
                <Message key={reply.id} message={reply} isThreadView />
              ))}
            </div>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-4 bg-red-50">
            <p className="text-red-600">Reply form is currently unavailable.</p>
          </div>
        }>
          <div className="p-4 border-t">
            <form onSubmit={handleSubmitReply} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 
                      focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                      transition-all duration-200"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <button
                      type="submit"
                      disabled={!replyText.trim()}
                      className="p-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed
                        rounded-lg hover:bg-white/5 transition-all duration-200"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
};

export default ThreadView;
