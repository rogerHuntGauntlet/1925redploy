declare module '@supabase/supabase-js'
declare module '@supabase/auth-helpers-nextjs'

interface Window {
  supabase: any;
  ethereum: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (params: any) => void) => void;
    removeListener: (event: string, callback: (params: any) => void) => void;
    isMetaMask?: boolean;
  };
} 