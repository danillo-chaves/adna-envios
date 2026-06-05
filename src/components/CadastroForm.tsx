'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, FileText, User, Hash, Phone, Mail, AlertCircle, Pencil, X } from 'lucide-react';
import { Clinica } from '../models/clinicaModel';

interface CadastroFormProps {
  onClinicaCadastrada: () => void;
  clinicaEmEdicao?: Clinica | null;
  onCancelarEdicao?: () => void;
}

export default function CadastroForm({ onClinicaCadastrada, clinicaEmEdicao, onCancelarEdicao }: CadastroFormProps) {
  const [idContrato, setIdContrato] = useState('');
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [celular, setCelular] = useState('');
  const [email, setEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Formata CNPJ: 00.000.000/0000-00
  const formatCnpj = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
    if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
    if (clean.length <= 12) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8)}`;
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12, 14)}`;
  };

  // Formata Celular: (00) 00000-0000
  const formatCelular = (value: string) => {
    const clean = value.replace(/\D/g, '');
    if (clean.length <= 2) return clean;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  };

  // Carrega informações para edição
  useEffect(() => {
    if (clinicaEmEdicao) {
      setIdContrato(clinicaEmEdicao.idContrato);
      setNome(clinicaEmEdicao.nome);
      setCnpj(formatCnpj(clinicaEmEdicao.cnpj));
      setCelular(formatCelular(clinicaEmEdicao.celular));
      setEmail(clinicaEmEdicao.email);
      setErrorMsg(null);
      setSuccess(false);
    } else {
      setIdContrato('');
      setNome('');
      setCnpj('');
      setCelular('');
      setEmail('');
    }
  }, [clinicaEmEdicao]);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCnpj(formatCnpj(e.target.value));
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCelular(formatCelular(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccess(false);

    const cleanCnpj = cnpj.replace(/\D/g, '');
    const cleanCelular = celular.replace(/\D/g, '');

    const isEditMode = !!clinicaEmEdicao;
    const url = isEditMode ? `/api/clinicas?idContrato=${idContrato}` : '/api/clinicas';
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idContrato,
          nome,
          cnpj: cleanCnpj,
          celular: cleanCelular,
          email,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        
        if (isEditMode) {
          // Se for edição, sai do modo de edição após salvar
          if (onCancelarEdicao) onCancelarEdicao();
        } else {
          // Limpa formulário
          setIdContrato('');
          setNome('');
          setCnpj('');
          setCelular('');
          setEmail('');
        }
        
        // Callback para atualizar lista
        onClinicaCadastrada();
        
        // Remove mensagem de sucesso após 3 segundos
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setErrorMsg(data.error || `Erro ao ${isEditMode ? 'atualizar' : 'cadastrar'} clínica.`);
      }
    } catch (err: any) {
      setErrorMsg('Erro de conexão ao servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative overflow-hidden bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-2xl">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none"></div>

      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
          {clinicaEmEdicao ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </div>
        <div>
          <h2 className="text-lg font-bold text-blue-900 font-sans tracking-wide">
            {clinicaEmEdicao ? 'Editar Clínica' : 'Cadastrar Nova Clínica'}
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {clinicaEmEdicao ? 'Atualize as informações da clínica credenciada' : 'Adicione clínicas credenciadas do Detran'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Contrato ID
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Hash className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={idContrato}
                onChange={(e) => setIdContrato(e.target.value)}
                placeholder="Ex: 102"
                required
                disabled={!!clinicaEmEdicao}
                className="w-full pl-9 pr-3 py-2 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>
          
          <div className="col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nome da Clínica
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Clínica Detran Centro Ltda"
                required
                className="w-full pl-9 pr-4 py-2 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              CNPJ
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <FileText className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                required
                className="w-full pl-9 pr-4 py-2 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              WhatsApp / Celular
            </label>
            <div className="relative group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={celular}
                onChange={handleCelularChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                required
                className="w-full pl-9 pr-4 py-2 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            E-mail de Destino
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="financeiro@clinicadetran.com.br"
              required
              className="w-full pl-9 pr-4 py-2 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/40 hover:border-slate-300 transition-all font-sans text-sm"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs animate-fadeIn">
            <Check className="w-4 h-4 shrink-0 text-emerald-500" />
            <span>{clinicaEmEdicao ? 'Clínica atualizada com sucesso!' : 'Clínica cadastrada com sucesso!'}</span>
          </div>
        )}

        <div className="flex gap-2">
          {clinicaEmEdicao && (
            <button
              type="button"
              onClick={onCancelarEdicao}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-sm active:translate-y-[1px]"
            >
              <X className="w-4 h-4 text-slate-500" />
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs tracking-wider uppercase transition-all shadow-md shadow-blue-500/10 active:translate-y-[1px] disabled:opacity-50"
          >
            {clinicaEmEdicao
              ? (isLoading ? 'Salvando...' : 'Salvar Alterações')
              : (isLoading ? 'Cadastrando...' : 'Adicionar Clínica')}
          </button>
        </div>
      </form>
    </div>
  );
}
