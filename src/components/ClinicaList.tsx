'use client';

import { useState } from 'react';
import { Trash2, Search, AlertTriangle, Eye, EyeOff, Pencil } from 'lucide-react';
import type { Clinica } from '../models/clinicaModel';

interface ClinicaListProps {
  clinicas: Clinica[];
  onRefresh: () => void;
  onEdit: (clinica: Clinica) => void;
  clinicaEmEdicaoId?: string | null;
}

export default function ClinicaList({ clinicas, onRefresh, onEdit, clinicaEmEdicaoId }: ClinicaListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIgnored, setFilterIgnored] = useState<'all' | 'active' | 'ignored'>('all');

  const handleToggleIgnorar = async (idContrato: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/clinicas?idContrato=${idContrato}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ignorarEnvio: !currentStatus }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao atualizar status de exceção:', err);
    }
  };

  const handleDelete = async (idContrato: string) => {
    if (!confirm('Deseja realmente remover esta clínica?')) return;
    try {
      const res = await fetch(`/api/clinicas?idContrato=${idContrato}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao deletar clínica:', err);
    }
  };

  // Filtra clínicas baseado na busca e no filtro de status
  const filteredClinicas = clinicas.filter((clinica) => {
    const matchesSearch =
      clinica.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinica.cnpj.includes(searchTerm) ||
      clinica.idContrato.includes(searchTerm) ||
      clinica.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterIgnored === 'all' ||
      (filterIgnored === 'active' && !clinica.ignorarEnvio) ||
      (filterIgnored === 'ignored' && clinica.ignorarEnvio);

    return matchesSearch && matchesStatus;
  });

  const formatCnpj = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  const formatCelular = (cel: string) => {
    if (cel.length === 11) {
      return cel.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return cel.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300">
      
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-blue-900 font-sans tracking-wide">Clínicas Cadastradas</h2>
          <p className="text-xs text-slate-500 font-medium">Gerencie a lista de clínicas e defina regras de exceção</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Input de Busca */}
          <div className="relative group min-w-[200px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="w-3.5 h-3.5" />
            </span>
            <input
              type="text"
              placeholder="Buscar clínica, ID, CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 text-xs transition-all"
            />
          </div>

          {/* Filtro de Exceção */}
          <div className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl p-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase px-1.5">Filtro:</span>
            <button
              onClick={() => setFilterIgnored('all')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterIgnored === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilterIgnored('active')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterIgnored === 'active'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              Ativas
            </button>
            <button
              onClick={() => setFilterIgnored('ignored')}
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                filterIgnored === 'ignored'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-850'
              }`}
            >
              Ignoradas
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Clínicas */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-4 py-3 text-center w-16">Contrato ID</th>
              <th className="px-4 py-3">Nome da Clínica</th>
              <th className="px-4 py-3 w-40">CNPJ</th>
              <th className="px-4 py-3 w-36">WhatsApp / Fone</th>
              <th className="px-4 py-3">E-mail de Envio</th>
              <th className="px-4 py-3 text-center w-28">Status de Envio</th>
              <th className="px-4 py-3 text-center w-24">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
            {filteredClinicas.length > 0 ? (
              filteredClinicas.map((clinica) => {
                const isEditing = clinica.idContrato === clinicaEmEdicaoId;
                return (
                  <tr
                    key={clinica.idContrato}
                    className={`hover:bg-slate-50/50 transition-colors ${
                      clinica.ignorarEnvio ? 'opacity-60 bg-slate-50' : ''
                    } ${
                      isEditing ? 'bg-blue-50/40 border-l-2 border-l-blue-500 font-medium' : ''
                    }`}
                  >
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600 bg-slate-50">
                      {clinica.idContrato}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {clinica.nome}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-500">
                      {formatCnpj(clinica.cnpj)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">
                      {formatCelular(clinica.celular)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 select-all">
                      {clinica.email}
                    </td>
                    
                    {/* Checkbox de Exceção */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleIgnorar(clinica.idContrato, clinica.ignorarEnvio)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border ${
                          clinica.ignorarEnvio
                            ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                            : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                        }`}
                        title={clinica.ignorarEnvio ? 'Clique para reativar envio' : 'Clique para ignorar envio'}
                      >
                        {clinica.ignorarEnvio ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            Ignorar
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            Enviar
                          </>
                        )}
                      </button>
                    </td>
  
                    {/* Ações */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEdit(clinica)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isEditing
                              ? 'bg-blue-100 text-blue-700'
                              : 'hover:bg-blue-50 hover:text-blue-600 text-slate-400'
                          }`}
                          title="Editar clínica"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(clinica.idContrato)}
                          className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                          title="Excluir clínica"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertTriangle className="w-6 h-6 text-slate-350" />
                    <p className="text-sm font-semibold">Nenhuma clínica encontrada.</p>
                    <p className="text-[10px] font-medium">Cadastre clínicas usando o formulário ao lado.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Resumo de clínicas */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-4 px-1 font-semibold">
        <span>Total: {clinicas.length} clínica(s) cadastrada(s)</span>
        <span>Ativas: {clinicas.filter(c => !c.ignorarEnvio).length} | Exceções: {clinicas.filter(c => c.ignorarEnvio).length}</span>
      </div>

      {/* Card de WhatsApp - Lista Separada */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-green-700 font-sans tracking-wide">Envios via WhatsApp</h2>
            <p className="text-xs text-slate-500 font-medium">Clínicas configuradas para receber mensagens pelo WhatsApp (Futuro)</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-green-200 rounded-xl bg-green-50/30">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-green-200 bg-green-100/50 text-green-800 text-[10px] font-bold uppercase tracking-wider">
                <th className="px-4 py-3 text-center w-16">Contrato ID</th>
                <th className="px-4 py-3">Nome da Clínica</th>
                <th className="px-4 py-3 w-36">WhatsApp / Fone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100/50 text-slate-700 text-xs">
              {clinicas.filter(c => c.enviarWhatsapp).length > 0 ? (
                clinicas.filter(c => c.enviarWhatsapp).map((clinica) => (
                  <tr key={clinica.idContrato} className="hover:bg-green-50/50 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-600">
                      {clinica.idContrato}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {clinica.nome}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-medium">
                      {formatCelular(clinica.celular)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    <p className="text-xs font-semibold">Nenhuma clínica configurada para WhatsApp.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
