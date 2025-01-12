import { sendDirectMessage } from './supabase';

interface QueuedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
  attempts: number;
}

const QUEUE_KEY = 'offline_message_queue';
const MAX_RETRIES = 3;

export const queueMessage = async (senderId: string, recipientId: string, content: string): Promise<string> => {
  const queuedMessage: QueuedMessage = {
    id: crypto.randomUUID(),
    senderId,
    recipientId,
    content,
    timestamp: new Date().toISOString(),
    attempts: 0
  };

  // Get existing queue
  const queue = getQueue();
  queue.push(queuedMessage);
  
  // Save updated queue
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  
  return queuedMessage.id;
};

export const getQueue = (): QueuedMessage[] => {
  const queueStr = localStorage.getItem(QUEUE_KEY);
  return queueStr ? JSON.parse(queueStr) : [];
};

export const removeFromQueue = (messageId: string) => {
  const queue = getQueue();
  const updatedQueue = queue.filter(msg => msg.id !== messageId);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));
};

export const processQueue = async () => {
  const queue = getQueue();
  if (queue.length === 0) return;

  const newQueue: QueuedMessage[] = [];

  for (const message of queue) {
    try {
      if (message.attempts >= MAX_RETRIES) {
        console.error(`Message ${message.id} exceeded max retries, removing from queue`);
        continue;
      }

      await sendDirectMessage(
        message.senderId,
        message.recipientId,
        message.content
      );

      // Message sent successfully, don't add it back to queue
    } catch (error) {
      console.error(`Failed to send queued message ${message.id}:`, error);
      // Add message back to queue with incremented attempts
      newQueue.push({
        ...message,
        attempts: message.attempts + 1
      });
    }
  }

  // Update queue with remaining messages
  localStorage.setItem(QUEUE_KEY, JSON.stringify(newQueue));
};

export const getQueueCount = (): number => {
  return getQueue().length;
}; 