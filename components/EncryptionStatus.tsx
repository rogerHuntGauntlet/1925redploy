import { useEffect, useState } from 'react';
import { useSupabase } from '@/lib/hooks/useSupabase';
import { getKeyVersionForRecord } from '@/lib/key-management';
import { Tooltip } from '@/components/Tooltip';

interface EncryptionStatusProps {
  table: string;
  recordId: string | number;
  className?: string;
}

export default function EncryptionStatus({ table, recordId, className = '' }: EncryptionStatusProps) {
  const [status, setStatus] = useState<'active' | 'rotating' | 'retired' | 'unknown'>('unknown');
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabase();

  useEffect(() => {
    async function checkEncryptionStatus() {
      try {
        const version = await getKeyVersionForRecord(supabase, table, recordId);
        
        if (!version) {
          setStatus('unknown');
          return;
        }

        const { data } = await supabase
          .from('encryption_keys')
          .select('status')
          .eq('version', version)
          .single();

        setStatus(data?.status || 'unknown');
      } catch (error) {
        console.error('Error checking encryption status:', error);
        setStatus('unknown');
      } finally {
        setIsLoading(false);
      }
    }

    checkEncryptionStatus();
  }, [table, recordId, supabase]);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="animate-pulse">🔄</span>
      </div>
    );
  }

  const statusConfig = {
    active: {
      icon: '🔒',
      text: 'Encrypted with active key',
      color: 'text-green-500'
    },
    rotating: {
      icon: '🔄',
      text: 'Key rotation in progress',
      color: 'text-yellow-500'
    },
    retired: {
      icon: '⚠️',
      text: 'Encrypted with retired key',
      color: 'text-red-500'
    },
    unknown: {
      icon: '❓',
      text: 'Encryption status unknown',
      color: 'text-gray-500'
    }
  };

  const config = statusConfig[status];

  return (
    <Tooltip content={config.text}>
      <div className={`inline-flex items-center ${config.color} ${className}`}>
        <span className="text-sm">{config.icon}</span>
      </div>
    </Tooltip>
  );
} 