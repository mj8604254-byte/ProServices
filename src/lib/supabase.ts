import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://kqbzokibwrlkwwljnfyn.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_1hpmjIIHcsmwBe3kYD5AYQ_nYCr4FQT';

if (supabaseAnonKey.includes('service_role') || supabaseAnonKey.startsWith('sb_secret_')) {
  console.warn('AVISO: Parece que está a usar uma Chave Secreta (Service Role) no navegador. Isso é inseguro e causará erros. Use a "anon" key ou "publishable code".');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function handleSupabaseError(error: any) {
  console.error('Supabase Error:', error);
  throw new Error(error.message || 'Erro inesperado no servidor');
}
