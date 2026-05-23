import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[name]) return metaEnv[name];
  
  if (typeof process !== 'undefined' && process.env && (process.env as any)[name]) {
    return (process.env as any)[name];
  }
  
  return undefined;
};

const supabaseUrl = 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  'https://kqbzokibwrlkwwljnfyn.supabase.co';

const supabaseAnonKey = 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 
  'sb_publishable_1hpmjIIHcsmwBe3kYD5AYQ_nYCr4FQT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function handleSupabaseError(error: any) {
  console.error('Supabase Error:', error);
  throw new Error(error.message || 'Erro inesperado no servidor');
}
