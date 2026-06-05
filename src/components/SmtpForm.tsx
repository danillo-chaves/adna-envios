'use client';

import { useState, useEffect } from 'react';
import { Mail, Key, ShieldCheck, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SmtpFormProps {
  onConfigChange?: () => void;
}

export default function SmtpForm({ onConfigChange }: SmtpFormProps) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState(465);
  const [secure, setSecure] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/smtp');
      const data = await res.json();
      if (res.ok) {
        setUser(data.user || '');
        setHost(data.host || 'smtp.gmail.com');
        setPort(data.port || 465);
        setSecure(data.secure !== undefined ? data.secure : true);
        setHasPassword(data.hasPassword);
        if (data.hasPassword) {
          setPass('••••••••••••');
        }
      }
    } catch (err) {
      console.error('Erro ao buscar SMTP config:', err);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass, host, port, secure }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Configurações SMTP salvas com sucesso!' });
        setHasPassword(true);
        if (onConfigChange) onConfigChange();
      } else {
        setMessage({ type: 'error', text: data.error || 'Erro ao salvar configurações.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro de rede. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/smtp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass, host, port, secure, testOnly: true }),
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'Conexão SMTP estabelecida e validada com sucesso!' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Falha na conexão SMTP.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Erro de rede ao testar SMTP.' });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
          <Mail className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-blue-900 font-sans tracking-wide">Configuração do SMTP</h2>
          <p className="text-xs text-slate-500 font-medium">Credenciais para disparo via Senha de App do Google</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            E-mail Remetente
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-hover:text-slate-500 transition-colors">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="seu_email@gmail.com"
              required
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Senha de App do Google
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-hover:text-slate-500 transition-colors">
              <Key className="w-4 h-4" />
            </span>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={hasPassword ? '••••••••••••' : 'Insira a senha de app de 16 dígitos'}
              required={!hasPassword}
              className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
            />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed font-medium">
            * Crie uma senha de app nas configurações de segurança da sua Conta Google.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Servidor SMTP
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-600 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Porta / SSL
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                value={port}
                onChange={(e) => {
                  const p = Number(e.target.value);
                  setPort(p);
                  if (p === 465) setSecure(true);
                  if (p === 587) setSecure(false);
                }}
                className="w-20 px-2 py-1.5 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs text-center focus:outline-none focus:border-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  const nextSecure = !secure;
                  setSecure(nextSecure);
                  setPort(nextSecure ? 465 : 587);
                }}
                className={`flex-1 px-2 py-1.5 border rounded-lg text-[10px] font-bold uppercase transition-all ${
                  secure
                    ? 'border-blue-500/20 bg-blue-50 text-blue-600'
                    : 'border-slate-200 bg-slate-50 text-slate-500'
                }`}
              >
                {secure ? 'SSL (Porta 465)' : 'STARTTLS (Porta 587)'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed animate-fadeIn ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div className="flex gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleTest}
            disabled={isTesting || isLoading || !user}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Testar Conexão
              </>
            )}
          </button>
          
          <button
            type="submit"
            disabled={isLoading || isTesting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-blue-500/10 active:translate-y-[1px] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Config'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
