'use client';

import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';
import { auth } from '../lib/firebaseClient';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [showSenha, setShowSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  // Validações de senha
  const hasLength = senha.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(senha);
  const hasNumber = /[0-9]/.test(senha);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(senha);
  const isPasswordValid = hasLength && hasLetter && hasNumber && hasSpecial;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, senha);
      } else {
        if (senha !== confirmarSenha) {
          throw new Error('As senhas não coincidem.');
        }
        if (!isPasswordValid) {
          throw new Error('A senha não atende aos requisitos mínimos.');
        }
        if (!nome.trim()) {
          throw new Error('O nome de usuário é obrigatório.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
        await updateProfile(userCredential.user, {
          displayName: nome.trim()
        });
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha inválidos.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(err.message || 'Ocorreu um erro na autenticação.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSenha('');
    setConfirmarSenha('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Logo / Título */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mb-4">
            <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="9" y="72" fontFamily="Georgia, serif" fontSize="62" fill="currentColor" fontWeight="bold">M</text>
              <text x="54" y="72" fontFamily="Georgia, serif" fontSize="62" fill="currentColor" fontWeight="bold">C</text>
              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ENVIOS M.C.</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Automação de Disparo de E-mails</p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl rounded-3xl p-8 sm:p-10 transition-all duration-500 animate-slideUp">
          
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {isLogin ? 'Acessar o Painel' : 'Criar Nova Conta'}
          </h2>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-shake">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Campo Nome (Apenas Cadastro) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nome de Usuário</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="Como devemos te chamar?"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            {/* Campo E-mail */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {/* Campo Senha */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-slate-400" />
                </div>
                <input
                  type={showSenha ? 'text' : 'password'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {/* Indicadores de Força da Senha */}
              {!isLogin && (
                <div className="mt-2 space-y-1.5 p-3 bg-slate-50/80 border border-slate-100 rounded-xl animate-fadeIn">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Requisitos da Senha</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasLength ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {hasLength ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
                      Mín. 8 caracteres
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasLetter ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {hasLetter ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
                      Letras
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasNumber ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
                      Números
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${hasSpecial ? 'text-emerald-500' : 'text-slate-400'}`}>
                      {hasSpecial ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5 opacity-50" />}
                      Caractere especial
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Campo Confirmar Senha (Apenas Cadastro) */}
            {!isLogin && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Confirmar Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmarSenha ? 'text' : 'password'}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 text-slate-800 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                    required={!isLogin}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmarSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Botão Principal */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>{isLogin ? 'Entrar no Sistema' : 'Criar Minha Conta'}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Toggle Login/Cadastro */}
          <div className="mt-8 text-center border-t border-slate-200/60 pt-6">
            <p className="text-sm font-medium text-slate-500">
              {isLogin ? 'Ainda não tem acesso?' : 'Já possui uma conta?'}
              <button
                onClick={toggleMode}
                className="ml-2 text-blue-600 hover:text-blue-800 font-bold transition-colors focus:outline-none"
              >
                {isLogin ? 'Criar Cadastro' : 'Fazer Login'}
              </button>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
