import { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Send, Loader2, FileCheck, Trash2, History } from 'lucide-react';
import type { Faltante } from '../models/faltantesModel';

interface HistoricoFaltantesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HistoricoFaltantesModal({ isOpen, onClose }: HistoricoFaltantesModalProps) {
  const [faltantes, setFaltantes] = useState<Faltante[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFaltanteId, setSelectedFaltanteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchFaltantes();
    }
  }, [isOpen]);

  const fetchFaltantes = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/faltantes');
      if (res.ok) {
        const data = await res.json();
        setFaltantes(data);
      }
    } catch (err) {
      console.error('Erro ao buscar faltantes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedFaltanteId) return;

    const faltante = faltantes.find(f => f.id === selectedFaltanteId);
    if (!faltante) return;

    setProcessingId(faltante.id!);

    try {
      // 1. Converter PDF para Base64
      const base64 = await fileToBase64(file);
      
      // 2. Chamar a API de envio de email
      const emailPayload = {
        clinica: faltante.clinica,
        contextType: 'boleto',
        anexos: {
          boleto: {
            name: file.name,
            size: file.size,
            base64
          }
        },
        hasSmtpConfig: true,
        monthYearText: getMonthYearText()
      };

      const sendRes = await fetch('/api/enviar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      });

      if (!sendRes.ok) {
        throw new Error('Falha ao enviar e-mail');
      }

      // 3. Deletar o registro de faltantes
      const delRes = await fetch(`/api/faltantes?id=${faltante.id}`, { method: 'DELETE' });
      if (delRes.ok) {
        setFaltantes(prev => prev.filter(f => f.id !== faltante.id));
        alert(`Boleto enviado com sucesso para ${faltante.clinica.nomeFantasia}!`);
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setProcessingId(null);
      setSelectedFaltanteId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        let encoded = reader.result as string;
        encoded = encoded.replace(/^data:(.*,)?/, '');
        resolve(encoded);
      };
      reader.onerror = error => reject(error);
    });
  };

  const getMonthYearText = () => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    const m = date.getMonth();
    const y = date.getFullYear();
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    return `${meses[m]} DE ${y}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-500" />
            Histórico de Boletos Faltantes
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-slate-50/50">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="application/pdf" 
            className="hidden" 
          />

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm font-medium">Carregando histórico...</p>
            </div>
          ) : faltantes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <FileCheck className="w-12 h-12 text-emerald-400" />
              <p className="text-sm font-medium">Nenhum boleto pendente! Tudo certo.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {faltantes.map((faltante) => {
                const isProcessing = processingId === faltante.id;
                return (
                  <div key={faltante.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex items-center justify-between gap-4 transition-all hover:border-indigo-200">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {faltante.clinica.nome || faltante.clinica.nomeFantasia || 'Clínica sem nome'}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Contrato: <span className="font-semibold text-slate-700">{faltante.clinica.idContrato}</span></p>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">
                        Faltou em: {new Date(faltante.dataHora).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedFaltanteId(faltante.id!);
                        if (fileInputRef.current) fileInputRef.current.click();
                      }}
                      disabled={isProcessing}
                      className="flex items-center gap-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-100 hover:border-indigo-600 shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-3.5 h-3.5" />
                          Anexar e Enviar
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
