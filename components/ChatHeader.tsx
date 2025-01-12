import React, { useState } from 'react';
import { Search, Hash, Users, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ErrorBoundary from './ErrorBoundary';

interface ChatHeaderProps {
  channelName: string;
  memberCount: number;
  onSettingsClick: () => void;
}

export default function ChatHeader({ channelName, memberCount, onSettingsClick }: ChatHeaderProps) {
  return (
    <ErrorBoundary fallback={
      <div className="p-4 border-b">
        <p className="text-red-600">Chat header is currently unavailable.</p>
      </div>
    }>
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">Channel info is unavailable.</p>
          </div>
        }>
          <div className="flex items-center space-x-2">
            <Hash className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold">{channelName}</h2>
            <div className="flex items-center space-x-1 text-gray-500">
              <Users className="w-4 h-4" />
              <span className="text-sm">{memberCount}</span>
            </div>
          </div>
        </ErrorBoundary>

        <ErrorBoundary fallback={
          <div className="p-2">
            <p className="text-yellow-600">Channel settings button is unavailable.</p>
          </div>
        }>
          <button
            onClick={onSettingsClick}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <Settings className="w-5 h-5 text-gray-500" />
          </button>
        </ErrorBoundary>
      </div>
    </ErrorBoundary>
  );
}
