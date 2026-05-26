import { createClient } from '@supabase/supabase-js';

const getEnvVar = (name: string): string | undefined => {
  const metaEnv = (import.meta as any).env;
  if (metaEnv && metaEnv[name]) return metaEnv[name];
  
  if (typeof process !== 'undefined' && process.env && (process.env as any)[name]) {
    return (process.env as any)[name];
  }
  
  return undefined;
};

const base64Decode = (str: string): string => {
  if (typeof atob === 'function') {
    return atob(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('binary');
  }
  return '';
};

const decodeJwt = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      base64Decode(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getSafeKey = (key: string | undefined): string => {
  const defaultKey = 'sb_publishable_1hpmjIIHcsmwBe3kYD5AYQ_nYCr4FQT';
  if (!key) return defaultKey;
  
  const lowerKey = key.toLowerCase();
  if (
    lowerKey.includes('service_role') || 
    lowerKey.includes('secret') || 
    lowerKey.startsWith('sb_secret_')
  ) {
    return defaultKey;
  }
  
  const decoded = decodeJwt(key);
  if (decoded && (decoded.role === 'service_role' || decoded.role === 'admin')) {
    return defaultKey;
  }
  
  return key;
};

const supabaseUrl = 
  getEnvVar('VITE_SUPABASE_URL') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || 
  'https://kqbzokibwrlkwwljnfyn.supabase.co';

const rawAnonKey = 
  getEnvVar('VITE_SUPABASE_ANON_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY') || 
  getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

const supabaseAnonKey = getSafeKey(rawAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function handleSupabaseError(error: any) {
  console.error('Supabase Error:', error);
  throw new Error(error.message || 'Erro inesperado no servidor');
}

