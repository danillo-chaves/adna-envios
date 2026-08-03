'use client';

import { useState, useEffect } from 'react';
import { Mail, Settings, Users, Send, Info, ChevronRight, LogOut, Loader2, History } from 'lucide-react';
import SmtpForm from '../components/SmtpForm';
import CadastroForm from '../components/CadastroForm';
import ClinicaList from '../components/ClinicaList';
import ComposerEmail from '../components/ComposerEmail';
import Login from '../components/Login';
import HistoricoFaltantesModal from '../components/HistoricoFaltantesModal';
import type { Clinica } from '../models/clinicaModel';
import { auth } from '../lib/firebaseClient';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Home() {
  const [clinicas, setClinicas] = useState<Clinica[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clinicas' | 'smtp'>('dashboard');
  const [hasSmtpConfig, setHasSmtpConfig] = useState(false);
  const [clinicaParaEditar, setClinicaParaEditar] = useState<Clinica | null>(null);
  const [isHistoricoOpen, setIsHistoricoOpen] = useState(false);

  // Auth states
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchClinicas();
      checkSmtpStatus();
    }
  }, [user]);

  const fetchClinicas = async () => {
    try {
      const res = await fetch('/api/clinicas');
      if (res.ok) {
        const data = await res.json();
        setClinicas(data);
      }
    } catch (err) {
      console.error('Erro ao obter clínicas:', err);
    }
  };

  const checkSmtpStatus = async () => {
    try {
      const res = await fetch('/api/smtp');
      if (res.ok) {
        const data = await res.json();
        setHasSmtpConfig(data.hasPassword && !!data.user);
      }
    } catch (err) {
      console.error('Erro ao verificar status SMTP:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col gap-3 items-center justify-center bg-slate-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">Verificando acesso...</span>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans antialiased selection:bg-blue-500/20 selection:text-blue-900">
      
      {/* Header Principal (Rich Cobalt Blue with glass/frost effect) */}
      <header className="sticky top-0 z-50 bg-blue-600/90 backdrop-blur-md border-b border-blue-500 shadow-md text-white transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <svg className="w-12 h-12 shrink-0 select-none text-white bg-white/10 rounded-xl border border-white/20 p-1 shadow-inner" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <text x="9" y="72" fontFamily="Georgia, serif" fontSize="62" fill="currentColor" fontWeight="bold">M</text>
              <text x="54" y="72" fontFamily="Georgia, serif" fontSize="62" fill="currentColor" fontWeight="bold">C</text>
              <line x1="50" y1="8" x2="50" y2="92" stroke="currentColor" strokeWidth="2" />
              <rect x="0" y="44" width="100" height="15" fill="white" rx="1" />
              <text x="50" y="54" fontFamily="sans-serif" fontSize="7.2" fontWeight="900" fill="#2563eb" textAnchor="middle" letterSpacing="0.4">ENVIOS DE EMAILS</text>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white font-sans uppercase">
                  ENVIOS DE E-MAILS E NOTAS
                </h1>
                <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-white/20 border border-white/20 text-white rounded-md">
                  V1.0 (LOCAL)
                </span>
              </div>
              <p className="text-[10px] text-blue-100 font-bold uppercase mt-0.5 tracking-wider">
                AUTOMAÇÃO DE ENVIO DE EMAIL E NOTAS FISCAIS DO DETRAN
              </p>
            </div>
          </div>

          {/* Navigation Buttons (Styled as Chips) */}
          <nav className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('dashboard');
                setClinicaParaEditar(null);
              }}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'dashboard'
                  ? 'border-blue-300 bg-blue-800 text-white shadow-inner'
                  : 'bg-slate-200/85 hover:bg-slate-300/90 text-slate-700 border-slate-300'
              }`}
            >
              <Send className={`w-3.5 h-3.5 ${activeTab === 'dashboard' ? 'text-blue-400' : 'text-blue-600'}`} />
              Painel de Disparo
            </button>
            <button
              onClick={() => setActiveTab('clinicas')}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'clinicas'
                  ? 'border-blue-300 bg-blue-800 text-white shadow-inner'
                  : 'bg-slate-200/85 hover:bg-slate-300/90 text-slate-700 border-slate-300'
              }`}
            >
              <Users className={`w-3.5 h-3.5 ${activeTab === 'clinicas' ? 'text-yellow-400' : 'text-amber-500'}`} />
              Clínicas ({clinicas.length})
            </button>
            <button
              onClick={() => {
                setActiveTab('smtp');
                setClinicaParaEditar(null);
              }}
              className={`flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                activeTab === 'smtp'
                  ? 'border-blue-300 bg-blue-800 text-white shadow-inner'
                  : 'bg-slate-200/85 hover:bg-slate-300/90 text-slate-700 border-slate-300'
              }`}
            >
              <Settings className={`w-3.5 h-3.5 ${activeTab === 'smtp' ? 'text-red-400' : 'text-red-600'}`} />
              SMTP
              {hasSmtpConfig ? (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"></span>
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping ml-1"></span>
              )}
            </button>
            <button
              onClick={() => setIsHistoricoOpen(true)}
              title="Histórico de Faltantes"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                isHistoricoOpen
                  ? 'border-indigo-300 bg-indigo-600 text-white shadow-inner'
                  : 'bg-slate-200/85 hover:bg-slate-300/90 text-slate-700 border-slate-300'
              }`}
            >
              <History className={`w-4 h-4 ${isHistoricoOpen ? 'text-indigo-200' : 'text-indigo-600'}`} />
            </button>
            
            <div className="w-px h-6 bg-white/20 mx-1"></div>
            
            <button
              onClick={() => signOut(auth)}
              title="Sair do Sistema"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border bg-slate-200/20 hover:bg-red-500/90 text-white border-transparent hover:border-red-400 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </header>

      {/* Linha Divisória Sutil Abaixo do Header */}
      <div className="w-full h-[1px] bg-slate-200"></div>

      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        
        {/* Notificação caso SMTP não esteja configurado */}
        {!hasSmtpConfig && activeTab !== 'smtp' && (
          <div className="mb-8 flex items-center justify-between gap-4 p-4 border border-red-200 bg-red-50 text-red-700 rounded-2xl shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-red-500 shrink-0" />
              <div className="text-xs font-medium">
                <span className="font-bold">SMTP Pendente:</span> Suas credenciais de e-mail ainda não foram configuradas. Defina suas configurações para conseguir disparar os PDFs.
              </div>
            </div>
            <button
              onClick={() => setActiveTab('smtp')}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[10px] uppercase shadow-sm transition-all shrink-0"
            >
              Configurar Agora
            </button>
          </div>
        )}

        {/* Conteúdo Renderizado por Aba */}
        <main className="min-h-[550px]">
          
          {/* ABA: PAINEL DE DISPARO */}
          {activeTab === 'dashboard' && (
            <div className="animate-fadeIn">
              <ComposerEmail clinicas={clinicas} />
            </div>
          )}

          {/* ABA: CLÍNICAS */}
          {activeTab === 'clinicas' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
              <div className="lg:col-span-4">
                <CadastroForm
                  onClinicaCadastrada={fetchClinicas}
                  clinicaEmEdicao={clinicaParaEditar}
                  onCancelarEdicao={() => setClinicaParaEditar(null)}
                />
              </div>
              <div className="lg:col-span-8">
                <ClinicaList
                  clinicas={clinicas}
                  onRefresh={fetchClinicas}
                  onEdit={(clinica) => setClinicaParaEditar(clinica)}
                  clinicaEmEdicaoId={clinicaParaEditar?.idContrato}
                />
              </div>
            </div>
          )}

          {/* ABA: CONFIGURAÇÕES SMTP */}
          {activeTab === 'smtp' && (
            <div className="max-w-xl mx-auto py-4 animate-fadeIn">
              <SmtpForm onConfigChange={checkSmtpStatus} />
            </div>
          )}
          
        </main>

        {/* Rodapé */}
        <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row sm:justify-between items-center gap-4 font-semibold">
          <p>© {new Date().getFullYear()} ENVIOS DE E-MAILS E NOTAS. Painel SaaS Local.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-800 cursor-help">Regras de Negócio</span>
            <span>|</span>
            <span className="hover:text-slate-800 cursor-pointer" onClick={() => setActiveTab('smtp')}>Servidor SMTP</span>
          </div>
        </footer>

        <HistoricoFaltantesModal isOpen={isHistoricoOpen} onClose={() => setIsHistoricoOpen(false)} />

      </div>
    </div>
  );
}
