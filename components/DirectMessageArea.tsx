'use client'

import { FC, useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Search } from 'lucide-react'
import { getDirectMessages, sendDirectMessage, getUserProfile, supabase } from '../lib/supabase'
import EmojiPicker from 'emoji-picker-react'
import ChatHeader from './ChatHeader'
import ProfileCard from './ProfileCard'
import type { SearchResult } from './ChatHeader'

interface DirectMessage {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  receiver_id: string;
  is_direct_message: boolean;
  channel: string;
  sender: {
    id: string;
    username: string;
    avatar_url: string;
  };
  receiver: {
    id: string;
    username: string;
    avatar_url: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  avatar_url: string;
  email: string;
  phone?: string;
  bio?: string;
  employer?: string;
  status: 'online' | 'offline' | 'away';
}

interface DirectMessageAreaProps {
  currentUser: { id: string; email: string; username?: string };
  otherUserId: string;
  isDMListCollapsed?: boolean;
  onClose?: () => void;
}

const DirectMessageArea: FC<DirectMessageAreaProps> = ({ currentUser, otherUserId, isDMListCollapsed = false, onClose }) => {
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isBroTyping, setIsBroTyping] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (otherUserId === 'bro-user') {
      // Set a mock profile for Bro user
      setOtherUser({
        id: 'bro-user',
        username: 'Bro',
        avatar_url: 'https://www.feistees.com/images/uploads/2015/05/silicon-valley-bro2bro-app-t-shirt_2.jpg',
        email: 'bro@example.com',
        status: 'online'
      })
      // Set empty messages array for Bro user
      setMessages([])
      setError(null)
      return
    }

    fetchMessages()
    fetchOtherUserProfile()
  }, [currentUser.id, otherUserId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const fetchedMessages = await getDirectMessages(currentUser.id, otherUserId)
      setMessages(fetchedMessages)
      setError(null)
    } catch (error) {
      console.error('Error fetching messages:', error)
      setError('Failed to load messages. Please try again.')
    }
  }

  const fetchOtherUserProfile = async () => {
    try {
      const profile = await getUserProfile(otherUserId)
      setOtherUser(profile)
      setError(null)
    } catch (error) {
      console.error('Error fetching other user profile:', error)
      setError('Failed to load user profile. Please try again.')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (newMessage.trim()) {
      // Special handling for Bro user
      if (otherUserId === 'bro-user') {
        const actualMessage = newMessage // Store the original message
        setNewMessage('') // Clear input immediately
        
        // Create a client-side message object for the user's "Yo"
        const userMessage: DirectMessage = {
          id: Date.now().toString(),
          content: 'Yo', // Always send "Yo" regardless of what was typed
          created_at: new Date().toISOString(),
          user_id: currentUser.id,
          receiver_id: 'bro-user',
          is_direct_message: true,
          channel: '',
          sender: {
            id: currentUser.id,
            username: currentUser.username || 'You',
            avatar_url: ''
          },
          receiver: {
            id: 'bro-user',
            username: 'Bro',
            avatar_url: 'https://www.feistees.com/images/uploads/2015/05/silicon-valley-bro2bro-app-t-shirt_2.jpg'
          }
        }
        
        // Add user's message immediately
        setMessages(messages => [...messages, userMessage])

        // Wait 1 second before showing typing indicator
        setTimeout(() => {
          setIsBroTyping(true)
          
          // Wait 3 more seconds of typing before sending response
          setTimeout(() => {
            setIsBroTyping(false)
            const broResponse: DirectMessage = {
              id: Date.now().toString(),
              content: 'Yo',
              created_at: new Date().toISOString(),
              user_id: 'bro-user',
              receiver_id: currentUser.id,
              is_direct_message: true,
              channel: '',
              sender: {
                id: 'bro-user',
                username: 'Bro',
                avatar_url: 'https://www.feistees.com/images/uploads/2015/05/silicon-valley-bro2bro-app-t-shirt_2.jpg'
              },
              receiver: {
                id: currentUser.id,
                username: currentUser.username || 'You',
                avatar_url: ''
              }
            }
            setMessages(messages => [...messages, broResponse])
          }, 3000)
        }, 1000)
        
        return
      }

      try {
        const sentMessage = await sendDirectMessage(currentUser.id, otherUserId, newMessage.trim())
        setMessages([...messages, sentMessage])
        setNewMessage('')
      } catch (error) {
        console.error('Error sending message:', error)
        setError('Failed to send message. Please try again.')
      }
    }
  }

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e as unknown as React.FormEvent)
    }
  }

  const handleSearchResult = (result: SearchResult) => {
    const messageElement = document.getElementById(`message-${result.messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
      }, 3000);
    }
  };

  // Remove the message override effect
  useEffect(() => {
    if (otherUserId === 'bro-user' && newMessage.trim() !== '') {
      // Removed the auto-conversion to "Yo"
    }
  }, [newMessage, otherUserId])

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          user_id,
          receiver_id
        `)
        .or(`and(user_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(user_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
        .ilike('content', `%${searchQuery}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Highlight the first matching message
        const messageElement = document.getElementById(`message-${data[0].id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          messageElement.classList.add('bg-yellow-100', 'dark:bg-yellow-900');
          setTimeout(() => {
            messageElement.classList.remove('bg-yellow-100', 'dark:bg-yellow-900');
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error searching messages:', error);
      setError('Failed to search messages');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {otherUser && (
            <>
              <img
                src={otherUser.avatar_url || 'https://via.placeholder.com/40'}
                alt={otherUser.username}
                className="w-8 h-8 rounded-full"
              />
              <span className="font-medium dark:text-white">{otherUser.username}</span>
            </>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          aria-label="Close direct message"
        >
          <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        </div>
      </form>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {otherUser && <ProfileCard user={otherUser} />}
        {messages.map((message) => (
          <div
            key={message.id}
            id={`message-${message.id}`}
            className={`flex ${message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${
              message.sender.id === currentUser.id ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
            } rounded-lg p-3 text-white`}>
              <p className="text-sm">{message.content}</p>
              <p className="text-xs text-gray-200 mt-1">{new Date(message.created_at).toLocaleString()}</p>
            </div>
          </div>
        ))}
        {isBroTyping && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-300 dark:bg-gray-700 rounded-lg p-3">
              <img 
                src="https://www.feistees.com/images/uploads/2015/05/silicon-valley-bro2bro-app-t-shirt_2.jpg" 
                alt="Bro" 
                className="w-6 h-6 rounded-full"
              />
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-white">Bro is typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 bg-gray-100 dark:bg-gray-800 flex items-end">
        <button
          type="button"
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
          onClick={() => alert('File upload not implemented in this demo')}
        >
          <Paperclip size={24} />
        </button>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-2 mx-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          rows={3}
        />
        <div className="flex flex-col justify-end space-y-2">
          <button
            type="button"
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          >
            <Smile size={24} />
          </button>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
          >
            <Send size={24} />
          </button>
        </div>
      </form>
      {showEmojiPicker && (
        <div className="absolute bottom-20 right-8 z-10">
          <EmojiPicker
            onEmojiClick={(emojiObject) => {
              setNewMessage(newMessage + emojiObject.emoji)
              setShowEmojiPicker(false)
            }}
          />
        </div>
      )}
    </div>
  )
}

export default DirectMessageArea
