'use client'

import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { encrypt, decrypt } from '@/lib/encryption';
import config from '@/lib/config';
import EncryptionStatus from './EncryptionStatus';

interface EncryptedData {
  encrypted: string;
  iv: string;
  tag: string;
  salt: string;
  version?: string;
}

interface Message {
  id: string;
  content?: string;
  encrypted_content?: EncryptedData;
  is_encrypted: boolean;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

interface DirectMessageAreaProps {
  currentUser: {
    id: string;
    email: string;
    username?: string;
  };
  otherUserId: string;
  isDMListCollapsed: boolean;
  onCloseAction: () => void;
}

interface RealtimeMessagePayload {
  new: Message;
  old: Message | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
}

export default function DirectMessageArea({ currentUser, otherUserId, isDMListCollapsed, onCloseAction }: DirectMessageAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isEncrypted, setIsEncrypted] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { supabase } = useSupabase();

  // Add close handler
  const handleClose = () => {
    onCloseAction();
  };

  // Generate a shared secret for the two users
  const getSharedSecret = () => {
    const sortedIds = [currentUser.id, otherUserId].sort();
    return `${sortedIds[0]}:${sortedIds[1]}:${config.app.name}`;
  };

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel('direct_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `sender_id=eq.${currentUser.id},recipient_id=eq.${otherUserId}`,
        },
        async (payload: RealtimeMessagePayload) => {
          const newMessage = payload.new;
          
          // Decrypt message if encrypted
          if (newMessage.is_encrypted && newMessage.encrypted_content) {
            try {
              const decryptedContent = await decrypt(
                newMessage.encrypted_content,
                getSharedSecret()
              );
              newMessage.content = decryptedContent;
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              newMessage.content = '[Encrypted Message]';
            }
          }
          
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('direct_messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        setError('Failed to load messages');
        return;
      }

      // Decrypt encrypted messages
      const processedMessages = await Promise.all(
        (data || []).map(async (message: Message) => {
          if (message.is_encrypted && message.encrypted_content) {
            try {
              const decryptedContent = await decrypt(
                message.encrypted_content,
                getSharedSecret()
              );
              return { ...message, content: decryptedContent };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return { ...message, content: '[Encrypted Message]' };
            }
          }
          return message;
        })
      );

      setMessages(processedMessages);
    };

    fetchMessages();

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser.id, otherUserId, supabase]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      let messageData: Partial<Message> = {
        sender_id: currentUser.id,
        recipient_id: otherUserId,
        created_at: new Date().toISOString(),
      };

      if (isEncrypted) {
        const encryptedContent = await encrypt(newMessage, getSharedSecret());
        messageData = {
          ...messageData,
          is_encrypted: true,
          encrypted_content: encryptedContent,
        };
      } else {
        messageData = {
          ...messageData,
          is_encrypted: false,
          content: newMessage,
        };
      }

      const { error } = await supabase
        .from('direct_messages')
        .insert([messageData]);

      if (error) throw error;

      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b">
        <h2>Direct Message</h2>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.sender_id === currentUser.id ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                message.sender_id === currentUser.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <p>{message.content}</p>
                {message.is_encrypted && (
                  <EncryptionStatus
                    table="direct_messages"
                    recordId={message.id}
                    className="ml-2"
                  />
                )}
              </div>
              <div className="text-xs opacity-75 text-right">
                {new Date(message.created_at).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </div>
      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setIsEncrypted(!isEncrypted)}
            className={`p-2 rounded-full ${
              isEncrypted ? 'bg-green-500 text-white' : 'bg-gray-200'
            }`}
            title={isEncrypted ? 'Encryption enabled' : 'Encryption disabled'}
          >
            {isEncrypted ? '🔒' : '🔓'}
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 p-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
