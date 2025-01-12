import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { MessageType } from '../types/database';
import Image from 'next/image';
import ErrorBoundary from './ErrorBoundary';
import Message from './Message';

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (parentId: string, content: string) => void;
  parentMessage: MessageType | null;
}

const ReplyModal: React.FC<ReplyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentMessage
}) => {
  const [replyContent, setReplyContent] = useState('');

  if (!isOpen || !parentMessage) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyContent.trim()) {
      onSubmit(parentMessage.id, replyContent.trim());
      setReplyContent('');
    }
  };

  return (
    <ErrorBoundary fallback={
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white p-4 rounded-lg">
          <p className="text-red-600">Reply functionality is currently unavailable.</p>
        </div>
      </div>
    }>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
          <ErrorBoundary fallback={
            <div className="p-4">
              <p className="text-yellow-600">Reply header is unavailable.</p>
            </div>
          }>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reply to Message</h3>
              <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
                <X size={20} />
              </button>
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallback={
            <div className="p-4">
              <p className="text-yellow-600">Original message display is unavailable.</p>
            </div>
          }>
            <div className="p-4 bg-gray-50">
              <Message 
                message={parentMessage} 
                isThreadView={true}
                currentUser={{ id: '', email: '' }}
                onReplyClick={() => {}}
                className="bg-gray-50"
              />
            </div>
          </ErrorBoundary>

          <ErrorBoundary fallback={
            <div className="p-4">
              <p className="text-yellow-600">Reply form is unavailable.</p>
            </div>
          }>
            <form onSubmit={handleSubmit} className="p-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply..."
                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replyContent.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Reply
                </button>
              </div>
            </form>
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ReplyModal; 