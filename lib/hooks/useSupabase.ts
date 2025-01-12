import { useContext } from 'react';
import { SupabaseContext } from '../supabase-provider';

interface SupabaseContextType {
  supabase: any;
  session: any | null;
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context as SupabaseContextType;
} 