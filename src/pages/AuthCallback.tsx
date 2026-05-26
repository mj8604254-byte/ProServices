import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro no callback de autenticação:', error.message);
        navigate('/auth?mode=login&error=' + encodeURIComponent(error.message));
        return;
      }

      // Check for error parameters in the URL (Supabase sends them on OAuth failure)
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      const errorName = params.get('error') || hashParams.get('error');
      const errorMsg = params.get('error_description') || hashParams.get('error_description') || errorName;
      
      if (errorMsg) {
        console.error('Auth Error from URL:', errorMsg);
        let userMessage = errorMsg;
        if (errorMsg.includes('provider is not enabled')) {
          userMessage = 'Este provedor de login não está ativado no Dashboard do Supabase.';
        } else if (errorMsg.includes('Forbidden use of secret API key')) {
          userMessage = 'Erro de Configuração: Chave secreta detectada no navegador. Use a chave "anon".';
        }
        navigate('/auth?mode=login&error=' + encodeURIComponent(userMessage));
        return;
      }

      const type = params.get('type') || hashParams.get('type');
      if (type === 'recovery') {
        navigate('/auth?mode=reset-password');
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData?.session) {
        // Redireciona para a home ou para a página de seleção de perfil
        navigate('/');
      } else {
        navigate('/auth?mode=login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[40px] shadow-soft border border-slate-100 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-orange animate-spin" />
        <div className="text-center">
          <h2 className="text-xl font-black text-navy uppercase tracking-tight">Autenticando...</h2>
          <p className="text-slate-500 font-medium mt-1">Por favor, aguarde enquanto finalizamos o seu acesso.</p>
        </div>
      </div>
    </div>
  );
}
