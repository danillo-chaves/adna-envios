'use client';

import { useState, useRef } from 'react';
import { Mail, FileText, CheckCircle2, XCircle, AlertCircle, Play, Tag, Paperclip, Trash2, Send, Folder } from 'lucide-react';
import type { Clinica } from '../models/clinicaModel';

interface ComposerEmailProps {
  clinicas: Clinica[];
}

interface AttachedFile {
  name: string;
  size: number;
  base64: string;
}

interface SendingResult {
  idContrato: string;
  nomeClinica: string;
  email: string;
  status: 'success' | 'failed' | 'skipped';
  reason?: string;
  arquivoEncontrado?: string;
}

export default function ComposerEmail({ clinicas }: ComposerEmailProps) {
  const [subject, setSubject] = useState('Nota Fiscal e Boleto de Serviços - Detran - {{nome_clinica}}');
  const [body, setBody] = useState(
    'Olá, {{nome_clinica}}!\n\nSegue em anexo a Nota Fiscal e o boleto correspondente ao Contrato ID {{id_contrato}}.\n\nDados cadastrados:\nCNPJ: {{cnpj_clinica}}\nWhatsApp: {{celular_clinica}}\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nFinanceiro Detran {{nome_clinica}} [{{id_contrato}}]'
  );

  // Armazena anexos indexados por idContrato e tipo (nota e/ou boleto)
  const [attachments, setAttachments] = useState<Record<string, { nota?: AttachedFile; boleto?: AttachedFile }>>({});
  const [contextType, setContextType] = useState<'nota' | 'boleto' | 'ambos'>('ambos');
  const [uploadingInfo, setUploadingInfo] = useState<{ idContrato: string; type: 'nota' | 'boleto' } | null>(null);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [readyClinicasCount, setReadyClinicasCount] = useState(0);

  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<SendingResult[] | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingFolder, setIsProcessingFolder] = useState(false);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const setTemplate = (type: 'nota' | 'boleto' | 'ambos') => {
    setContextType(type);
    if (type === 'nota') {
      setSubject('Nota Fiscal de Serviços - SISMAC - {{nome_clinica}}');
      setBody(
        'Olá, {{nome_clinica}}!\n\nSegue em anexo a Nota Fiscal eletrônica correspondente ao Contrato ID {{id_contrato}}.\n\nDados cadastrados:\nCNPJ: {{cnpj_clinica}}\nWhatsApp: {{celular_clinica}}\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nSpin-off Tecnologia {{nome_clinica}} [{{id_contrato}}]'
      );
    } else if (type === 'boleto') {
      setSubject('Boleto de Pagamento - SISMAC - {{nome_clinica}}');
      setBody(
        'Olá, {{nome_clinica}}!\n\nSegue em anexo o boleto bancário para pagamento correspondente ao Contrato ID {{id_contrato}}.\n\nDados cadastrados:\nCNPJ: {{cnpj_clinica}}\nWhatsApp: {{celular_clinica}}\n\nPor favor, efetue o pagamento até o vencimento. Qualquer dúvida, nos avise.\n\nAtenciosamente,\nSpin-off Tecnologia {{nome_clinica}} [{{id_contrato}}]'
      );
    } else {
      setSubject('Nota Fiscal e Boleto de Serviços - SISMAC - {{nome_clinica}}');
      setBody(
        'Olá, {{nome_clinica}}!\n\nSegue em anexo a Nota Fiscal e o boleto correspondente ao Contrato ID {{id_contrato}}.\n\nDados cadastrados:\nCNPJ: {{cnpj_clinica}}\nWhatsApp: {{celular_clinica}}\n\nQualquer dúvida, estamos à disposição.\n\nAtenciosamente,\nSpin-off Tecnologia {{nome_clinica}} [{{id_contrato}}]'
      );
    }
  };

  const handleAttachClick = (idContrato: string, type: 'nota' | 'boleto') => {
    setUploadingInfo({ idContrato, type });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset value
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && uploadingInfo) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf') {
        alert('Por favor, envie apenas arquivos em formato PDF.');
        setUploadingInfo(null);
        return;
      }
      try {
        const base64 = await fileToBase64(file);
        const { idContrato, type } = uploadingInfo;
        setAttachments(prev => {
          const current = prev[idContrato] || {};
          return {
            ...prev,
            [idContrato]: {
              ...current,
              [type]: {
                name: file.name,
                size: file.size,
                base64,
              }
            }
          };
        });
      } catch (err) {
        console.error('Erro ao ler arquivo:', err);
      } finally {
        setUploadingInfo(null);
      }
    }
  };

  const handleFolderClick = () => {
    if (folderInputRef.current) {
      folderInputRef.current.value = '';
      folderInputRef.current.click();
    }
  };

  const handleFolderChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingFolder(true);
    
    const pdfFiles = Array.from(files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      alert('Nenhum arquivo PDF encontrado na pasta selecionada.');
      setIsProcessingFolder(false);
      return;
    }

    let matchCount = 0;
    const newAttachments = { ...attachments };

    for (const file of pdfFiles) {
      // O nome do arquivo sem extensão
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      
      // Procura a clínica onde o ID do contrato existe como palavra isolada no nome
      const clinicaMatch = clinicas.find(c => {
        const regex = new RegExp(`\\b${c.idContrato}\\b`);
        return regex.test(nameWithoutExt);
      });

      if (clinicaMatch) {
        try {
          const base64 = await fileToBase64(file);
          const id = clinicaMatch.idContrato;
          
          if (!newAttachments[id]) {
            newAttachments[id] = {};
          }
          
          newAttachments[id].boleto = {
            name: file.name,
            size: file.size,
            base64,
          };
          matchCount++;
        } catch (err) {
          console.error(`Erro ao ler arquivo ${file.name}:`, err);
        }
      }
    }

    setAttachments(newAttachments);
    setIsProcessingFolder(false);
    alert(`Processamento concluído!\n${matchCount} boleto(s) vinculado(s) automaticamente a partir de ${pdfFiles.length} PDF(s) lidos na pasta.`);
  };

  const handleRemoveAttachment = (idContrato: string, type: 'nota' | 'boleto') => {
    setAttachments((prev) => {
      const newAttachments = { ...prev };
      if (newAttachments[idContrato]) {
        delete newAttachments[idContrato][type];
        // Se ambos foram removidos, deleta o idContrato do objeto para manter limpo
        if (!newAttachments[idContrato].nota && !newAttachments[idContrato].boleto) {
          delete newAttachments[idContrato];
        }
      }
      return newAttachments;
    });
  };

  const handleAttachMockPDFs = () => {
    const dummyPDF = "data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgplbmRvYmoKCjIgMCBvYmoKPDwKICAvVHlwZSAvUGFnZXMKICAvTWVkaWFCb3ggWyAwIDAgMjAwIDIwMCBdCiAgL0NvdW50IDEKICAvS2lkcyBbIDMgMCBSIF0KPj4KZW5kb2JqCgozIDAgb2JqCjw8CiAgL1R5cGUgL1BhZ2UKICAvUGFyZW50IDIgMCBSCiAgL1Jlc291cmNlcyA8PAogICAgL0ZvbnQgPDwKICAgICAgL0YxIDQgMCBSCgkJPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgplbmRvYmoKCjQgMCBvYmoKPDwKICAvVHlwZSAvRm9udAogIC9TdWJ0eXBlIC9UeXBlMQogIC9CYXNlRm9udCAvVGltZXMtUm9tYW4KPj4KZW5kb2JqCgo1IDAgb2JqCjw8IC9MZW5ndGggMzkgPj4Kc3RyZWFtCkJUCi9GMSAxOCBUZgoyMCAxNTAgVGQKKEhlbGxvLCBXb3JsZCEpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDY5IDAwMDAwIG4gCjAwMDAwMDAxNTIgMDAwMDAgbiAKMDAwMDAwMDI5NiAwMDAwMCBuIAowMDAwMDAwMzg0IDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQ3MwolJUVPRgo=";

    setAttachments(prev => {
      const mockAttachments: any = { ...prev };
      clinicas.forEach(c => {
        mockAttachments[c.idContrato] = {
          ...(mockAttachments[c.idContrato] || {}),
          boleto: {
            name: `boleto_${c.idContrato}.pdf`,
            size: 1024,
            base64: dummyPDF
          }
        };
      });
      return mockAttachments;
    });

    alert('PDF anexado como BOLETO em TODAS as clínicas carregadas na tela!');
  };

  // Calcula estatísticas de mapeamento em tempo real
  const getClinicaStatus = (clinica: Clinica) => {
    if (clinica.ignorarEnvio) {
      return { 
        code: 'ignored', 
        text: 'Excluída (Ignorar)', 
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        stripColor: 'bg-amber-400' 
      };
    }
    const match = attachments[clinica.idContrato];
    const hasEmail = clinica.email && clinica.email.includes('@');
    
    if (contextType === 'nota') {
      if (match?.nota) {
        return hasEmail
          ? { code: 'ready', text: 'Pronta para Envio', color: 'text-blue-700 bg-blue-50 border-blue-200', stripColor: 'bg-blue-600', file: match.nota.name }
          : { code: 'invalid_email', text: 'E-mail Inválido', color: 'text-rose-700 bg-rose-50 border-rose-200', stripColor: 'bg-rose-500', file: match.nota.name };
      }
      return { code: 'missing', text: 'SEM PDF NOTA', color: 'text-white bg-red-600 border-red-700 shadow-sm font-bold', stripColor: 'bg-red-600' };
    } 
    
    if (contextType === 'boleto') {
      if (match?.boleto) {
        return hasEmail
          ? { code: 'ready', text: 'Pronta para Envio', color: 'text-blue-700 bg-blue-50 border-blue-200', stripColor: 'bg-blue-600', file: match.boleto.name }
          : { code: 'invalid_email', text: 'E-mail Inválido', color: 'text-rose-700 bg-rose-50 border-rose-200', stripColor: 'bg-rose-500', file: match.boleto.name };
      }
      return { code: 'missing', text: 'SEM PDF BOLETO', color: 'text-white bg-red-600 border-red-700 shadow-sm font-bold', stripColor: 'bg-red-600' };
    }

    // Caso 'ambos' (ambos arquivos são obrigatórios)
    const hasNota = !!match?.nota;
    const hasBoleto = !!match?.boleto;
    
    if (match?.nota && match?.boleto) {
      return hasEmail
        ? { code: 'ready', text: 'Pronta para Envio', color: 'text-blue-700 bg-blue-50 border-blue-200', stripColor: 'bg-blue-600', file: `${match.nota.name}, ${match.boleto.name}` }
        : { code: 'invalid_email', text: 'E-mail Inválido', color: 'text-rose-700 bg-rose-50 border-rose-200', stripColor: 'bg-rose-500', file: `${match.nota.name}, ${match.boleto.name}` };
    }

    if (hasNota) {
      return { code: 'incomplete', text: 'Falta Boleto', color: 'text-amber-700 bg-amber-50 border-amber-200', stripColor: 'bg-amber-400' };
    }
    if (hasBoleto) {
      return { code: 'incomplete', text: 'Falta Nota', color: 'text-amber-700 bg-amber-50 border-amber-200', stripColor: 'bg-amber-400' };
    }
    
    return { code: 'missing', text: 'SEM PDFs', color: 'text-white bg-red-600 border-red-700 shadow-sm font-bold', stripColor: 'bg-red-600' };
  };

  const insertTag = (tag: string) => {
    setBody(prev => prev + ' ' + tag);
  };

  const handleDispararClick = () => {
    const readyClinicas = clinicas.filter(c => getClinicaStatus(c).code === 'ready');
    
    if (readyClinicas.length === 0) {
      alert('Nenhuma clínica possui os requisitos de envio (PDFs anexados de acordo com o contexto, e-mail válido e checkbox ativo).');
      return;
    }

    setReadyClinicasCount(readyClinicas.length);
    setIsConfirmModalOpen(true);
  };

  const executeDisparar = async () => {
    setIsConfirmModalOpen(false);
    const readyClinicas = clinicas.filter(c => getClinicaStatus(c).code === 'ready');
    
    setIsSending(true);
    setResults(null);
    setGeneralError(null);

    // Constrói o corpo da requisição com os arquivos correspondentes ao contexto ativo
    const apiAttachments: Record<string, Array<{ name: string; base64: string }>> = {};
    for (const clinica of readyClinicas) {
      const match = attachments[clinica.idContrato];
      if (!match) continue;

      const list: Array<{ name: string; base64: string }> = [];
      if (contextType === 'nota' || contextType === 'ambos') {
        if (match.nota) list.push({ name: match.nota.name, base64: match.nota.base64 });
      }
      if (contextType === 'boleto' || contextType === 'ambos') {
        if (match.boleto) list.push({ name: match.boleto.name, base64: match.boleto.base64 });
      }
      if (list.length > 0) {
        apiAttachments[clinica.idContrato] = list;
      }
    }

    try {
      const res = await fetch('/api/enviar-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectTemplate: subject,
          bodyTemplate: body,
          contextType: contextType,
          attachments: apiAttachments, // Envia o dicionário ID -> Lista de Arquivos
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setResults(data.results);
      } else {
        setGeneralError(data.error || 'Erro geral ao processar disparos.');
      }
    } catch (err: any) {
      setGeneralError('Erro de rede durante o processamento do disparo.');
    } finally {
      setIsSending(false);
      // Rolar a tela para baixo após a atualização do DOM para que o usuário veja a tabela de resultados
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  };

  // Renderiza a pré-visualização formatada do corpo de e-mail com badges coloridos
  const renderFormattedPreview = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">Escreva algo para ver a pré-visualização...</p>;
    
    const regex = /({{[a-zA-Z0-9_]+}})/g;
    const parts = text.split(regex);
    
    return (
      <div className="whitespace-pre-wrap break-words leading-relaxed text-xs text-slate-700 font-sans">
        {parts.map((part, index) => {
          if (part === '{{nome_clinica}}') {
            return (
              <span key={index} className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-600 text-white rounded text-[10px] font-bold font-mono">
                [Nome da Clínica]
              </span>
            );
          }
          if (part === '{{cnpj_clinica}}') {
            return (
              <span key={index} className="inline-block px-1.5 py-0.5 mx-0.5 bg-blue-600 text-white rounded text-[10px] font-bold font-mono">
                [CNPJ]
              </span>
            );
          }
          if (part === '{{id_contrato}}') {
            return (
              <span key={index} className="inline-block px-1.5 py-0.5 mx-0.5 bg-amber-400 text-slate-900 rounded text-[10px] font-bold font-mono">
                [ID Contrato]
              </span>
            );
          }
          if (part === '{{celular_clinica}}') {
            return (
              <span key={index} className="inline-block px-1.5 py-0.5 mx-0.5 bg-amber-400 text-slate-900 rounded text-[10px] font-bold font-mono">
                [WhatsApp]
              </span>
            );
          }
          return part;
        })}
      </div>
    );
  };

  // Renderiza um slot individual de upload/anexo
  const renderAttachmentSlot = (clinica: Clinica, type: 'nota' | 'boleto', label: string) => {
    const match = attachments[clinica.idContrato];
    const file = match ? match[type] : undefined;

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase w-20 shrink-0">{label}:</span>
        {file ? (
          <div className="flex-1 flex items-center justify-between gap-1.5 text-[10px] text-slate-600 font-mono bg-slate-50 p-2 border border-slate-200 rounded truncate">
            <div className="flex items-center gap-1.5 truncate">
              <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate" title={file.name}>{file.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[9px] text-slate-400 font-sans">({(file.size / 1024).toFixed(1)} KB)</span>
              <button
                type="button"
                onClick={() => handleRemoveAttachment(clinica.idContrato, type)}
                className="text-slate-450 hover:text-rose-600 transition-colors p-0.5 hover:bg-slate-100 rounded"
                title={`Remover ${label}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => handleAttachClick(clinica.idContrato, type)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold rounded-lg text-[10px] uppercase transition-all shadow-sm active:translate-y-[0.5px]"
          >
            <Paperclip className="w-3 h-3 text-slate-900" />
            Anexar {label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Input de arquivo invisível para arquivos únicos */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* Input de arquivo invisível para pastas */}
      <input
        type="file"
        ref={folderInputRef}
        onChange={handleFolderChange}
        accept="application/pdf"
        // @ts-ignore - Atributos específicos de pastas (WebKit/Blink)
        webkitdirectory="true"
        directory="true"
        multiple
        className="hidden"
      />

      {/* Esquerda: Compositor de Mensagem */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900 font-sans tracking-wide">Compositor de Mensagem</h2>
              <p className="text-xs text-slate-500 font-medium">Escreva o assunto e corpo do e-mail com variáveis</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Escolha de Contexto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Contexto / Tipo de Envio
              </label>
              <div className="flex gap-1 bg-slate-100 p-1 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => setTemplate('nota')}
                  className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wide ${
                    contextType === 'nota'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Nota Fiscal (NF-e)
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('boleto')}
                  className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wide ${
                    contextType === 'boleto'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Boleto
                </button>
                <button
                  type="button"
                  onClick={() => setTemplate('ambos')}
                  className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold transition-all uppercase tracking-wide ${
                    contextType === 'ambos'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Ambos (Nota + Boleto)
                </button>
              </div>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assunto do E-mail
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex: Guia Detran e NF-e - {{nome_clinica}}"
                className="w-full px-4 py-2.5 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-all font-sans text-sm"
              />
            </div>

            {/* Tags Auxiliares */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Corpo do E-mail
                </label>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Tag className="w-3 h-3 text-blue-600" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Variáveis Dinâmicas:</span>
                </div>
              </div>

              {/* Botões das Tags (Vibrantly Color-Coded) */}
              <div className="flex flex-wrap gap-2 mb-3 bg-slate-50 p-2 border border-slate-200 rounded-xl">
                <button
                  type="button"
                  onClick={() => insertTag('{{nome_clinica}}')}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-wide transition-all shadow-sm"
                  title="Nome da clínica"
                >
                  Nome
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('{{cnpj_clinica}}')}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold tracking-wide transition-all shadow-sm"
                  title="CNPJ formatado"
                >
                  CNPJ
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('{{id_contrato}}')}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-[10px] font-bold tracking-wide transition-all shadow-sm"
                  title="ID do contrato"
                >
                  ID Contrato
                </button>
                <button
                  type="button"
                  onClick={() => insertTag('{{celular_clinica}}')}
                  className="flex items-center gap-1 px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-lg text-[10px] font-bold tracking-wide transition-all shadow-sm"
                  title="Celular/WhatsApp"
                >
                  WhatsApp
                </button>
              </div>

              {/* Textarea */}
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                placeholder="Insira o texto e posicione as tags onde achar adequado..."
                className="w-full px-4 py-3 bg-white text-slate-800 placeholder-slate-400 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 transition-all font-mono text-xs leading-relaxed"
              ></textarea>
            </div>

            {/* Pré-visualização em tempo real com Badges Coloridos */}
            <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">Visualização Dinâmica da Mensagem</h4>
              <div className="max-h-40 overflow-y-auto bg-white border border-slate-150 p-3 rounded-lg shadow-inner">
                {renderFormattedPreview(body)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Direita: Status de Disparo */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300 flex flex-col h-full min-h-[500px]">
          
          <div className="flex items-center gap-3 mb-6 shrink-0">
            <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
              <Play className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-blue-900 font-sans tracking-wide">Status de Disparo</h2>
              <p className="text-xs text-slate-500 font-medium">Anexe PDFs individualmente e dispare e-mails</p>
            </div>
          </div>

          {/* Listagem de clínicas e status */}
          <div className="flex-1 overflow-y-auto min-h-[450px] max-h-[600px] border border-slate-200/80 p-3 bg-slate-50 rounded-xl space-y-3.5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clínicas e Anexos</h4>
              
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={handleAttachMockPDFs}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-lg text-[10px] uppercase transition-all shadow-sm active:translate-y-[0.5px] shrink-0"
                >
                  ANEXAR BOLETOS
                </button>
                {(contextType === 'boleto' || contextType === 'ambos') && (
                  <button
                    type="button"
                    onClick={handleFolderClick}
                    disabled={isProcessingFolder}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] uppercase transition-all shadow-sm active:translate-y-[0.5px] disabled:opacity-50 shrink-0"
                    title="Selecione uma pasta contendo os boletos. O sistema vinculará os PDFs automaticamente verificando o número do contrato no nome do arquivo."
                  >
                    <Folder className="w-3 h-3" />
                    {isProcessingFolder ? 'Processando...' : 'Importar Boletos (Pasta)'}
                  </button>
                )}
              </div>
            </div>
            {clinicas.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-8">Nenhuma clínica cadastrada.</p>
            ) : (
              clinicas.map((clinica) => {
                const status = getClinicaStatus(clinica);
                return (
                  <div
                    key={clinica.idContrato}
                    className="relative pl-5 pr-3 py-3 rounded-xl bg-white border border-slate-200/80 shadow-sm flex flex-col gap-2 transition-all hover:bg-slate-50/20 overflow-hidden"
                  >
                    {/* Linha vertical colorida de destaque no canto esquerdo */}
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${status.stripColor}`} />

                    <div className="flex justify-between items-start">
                      <div className="truncate pr-2">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 mr-1.5">{clinica.idContrato}</span>
                        <span className="font-extrabold text-blue-900 text-xs">{clinica.nome}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 uppercase tracking-wider ${status.color}`}>
                        {status.text}
                      </span>
                    </div>

                    {/* Exibe slots de anexo de acordo com o contexto do disparo */}
                    {!clinica.ignorarEnvio && (
                      <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2.5">
                        {(contextType === 'nota' || contextType === 'ambos') && renderAttachmentSlot(clinica, 'nota', 'Nota Fiscal')}
                        {(contextType === 'boleto' || contextType === 'ambos') && renderAttachmentSlot(clinica, 'boleto', 'Boleto')}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Erro geral */}
          {generalError && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs mb-4 shrink-0">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
              <span>{generalError}</span>
            </div>
          )}

          {/* Botão de Disparo */}
          <button
            onClick={handleDispararClick}
            disabled={isSending || clinicas.filter(c => getClinicaStatus(c).code === 'ready').length === 0}
            className="w-full mt-auto flex items-center justify-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black tracking-wider uppercase rounded-xl text-xs shadow-lg shadow-blue-500/20 hover:-translate-y-[1px] active:translate-y-[1px] transition-all disabled:opacity-40 disabled:pointer-events-none"
          >
            <Send className="w-4 h-4 text-white" />
            {isSending ? 'Processando envio em massa...' : 'Disparar E-mails'}
          </button>
        </div>
      </div>

      {/* Tabela de logs do disparo em largura total (Abaixo dos cards) */}
      {results && (
        <div className="col-span-12 bg-white/95 backdrop-blur-md border border-slate-200 shadow-xl rounded-2xl p-6 transition-all duration-300 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-150 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-blue-900 font-sans tracking-wide">Logs de Envio de E-mails</h3>
                <p className="text-xs text-slate-500 font-medium">Relatório e histórico detalhado de status dos disparos de boletos e notas fiscais</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-150 text-blue-600">
                Total: {results.length}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 border border-emerald-150 text-emerald-700">
                Sucesso: {results.filter(r => r.status === 'success').length}
              </span>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 border border-rose-150 text-rose-700">
                Falha: {results.filter(r => r.status === 'failed').length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl bg-slate-50/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-255 bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-4 py-3 text-center w-20">Contrato ID</th>
                  <th className="px-4 py-3 w-64">Clínica</th>
                  <th className="px-4 py-3 w-48">E-mail Destinatário</th>
                  <th className="px-4 py-3 w-60">Arquivo PDF</th>
                  <th className="px-4 py-3 text-center w-24">Status</th>
                  <th className="px-4 py-3">Motivo / Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-slate-700 text-xs">
                {results.map((res, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-500 bg-slate-100/30">
                      {res.idContrato}
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      {res.nomeClinica}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 select-all font-medium">
                      {res.email || 'Nenhum e-mail cadastrado'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px] truncate max-w-[200px]" title={res.arquivoEncontrado}>
                      {res.arquivoEncontrado || 'Não anexado'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        res.status === 'success'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : res.status === 'skipped'
                          ? 'bg-amber-50 border-amber-200 text-amber-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}>
                        {res.status === 'success' ? 'Enviado' : res.status === 'skipped' ? 'Pulado' : 'Falhou'}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 text-[11px] ${
                      res.status === 'failed' ? 'text-rose-600 font-medium' : 'text-slate-550'
                    }`}>
                      {res.reason || 'Envio realizado e validado com sucesso.'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all ring-1 ring-slate-900/5">
            <div className="p-6 sm:p-8 text-center">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-blue-50/50">
                <Send className="w-10 h-10 ml-1" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 font-sans tracking-tight">Confirmar Disparo</h3>
              <p className="text-slate-600 text-[15px] mb-8 leading-relaxed px-2">
                Você está prestes a enviar e-mails para <strong className="text-blue-700 font-black text-lg">{readyClinicasCount}</strong> clínica{readyClinicasCount > 1 ? 's' : ''}.<br/>Deseja continuar com o envio em massa?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsConfirmModalOpen(false)}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDisparar}
                  className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex justify-center items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Sim, Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
