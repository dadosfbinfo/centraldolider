import React from 'react';
import {
  CalendarioEvento,
  TarefaOS,
  Relatorio,
  EventType,
  CommentTargetType
} from '../../types/database';
import { CommentsThread } from '../comments/CommentsThread';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Video,
  Building2,
  User,
  Users,
  CheckCircle2,
  AlertCircle,
  FileText,
  CheckSquare,
  ExternalLink,
  Info,
  Shield,
  Sparkles,
  BookOpen
} from 'lucide-react';

export interface UnifiedCalendarItem {
  id: string;
  sourceId: string;
  titulo: string;
  tipo: EventType;
  categoriaCor: string;
  data: string; // YYYY-MM-DD
  horario_inicio: string;
  horario_fim?: string;
  dia_inteiro?: boolean;
  unidade_nome?: string;
  lider_nome?: string;
  descricao?: string;
  local?: string;
  link_reuniao?: string;
  status?: string;
  sourceType: 'EVENTO_MANUAL' | 'TAREFA' | 'RELATORIO' | 'PENDENCIA';
  rawTask?: TarefaOS;
  rawReport?: Relatorio;
  rawEvent?: CalendarioEvento;
}

interface CalendarItemDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: UnifiedCalendarItem | null;
  onOpenTask?: (task: TarefaOS) => void;
  onOpenReport?: (report: Relatorio) => void;
}

export const CalendarItemDetailModal: React.FC<CalendarItemDetailModalProps> = ({
  isOpen,
  onClose,
  item,
  onOpenTask,
  onOpenReport,
}) => {
  if (!isOpen || !item) return null;

  // Determine comment target type and id
  let commentTargetType: CommentTargetType = 'EVENTO';
  let commentItemId = item.sourceId;

  if (item.sourceType === 'TAREFA' || item.sourceType === 'PENDENCIA') {
    commentTargetType = 'TAREFA';
  } else if (item.sourceType === 'RELATORIO') {
    commentTargetType = 'RELATORIO';
  } else {
    commentTargetType = 'EVENTO';
  }

  // Type visual configurations
  const getTypeBadge = () => {
    switch (item.tipo) {
      case 'TAREFA':
        return {
          label: 'Tarefa / Ordem de Serviço',
          icon: <CheckSquare className="w-3.5 h-3.5" />,
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          dot: 'bg-blue-600',
        };
      case 'PENDENCIA':
        return {
          label: 'Pendência / OS em Atraso',
          icon: <AlertCircle className="w-3.5 h-3.5" />,
          bg: 'bg-red-50 border-red-200 text-red-800',
          dot: 'bg-red-600',
        };
      case 'REUNIAO':
        return {
          label: 'Reunião de Alinhamento',
          icon: <Video className="w-3.5 h-3.5" />,
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
        };
      case 'RELATORIO':
        return {
          label: 'Publicação de Relatório',
          icon: <FileText className="w-3.5 h-3.5" />,
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-600',
        };
      case 'TREINAMENTO':
        return {
          label: 'Treinamento & Capacitação',
          icon: <BookOpen className="w-3.5 h-3.5" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-600',
        };
      case 'COMUNICADO':
        return {
          label: 'Comunicado Operacional',
          icon: <Info className="w-3.5 h-3.5" />,
          bg: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          dot: 'bg-indigo-600',
        };
      default:
        return {
          label: 'Evento Operacional',
          icon: <Calendar className="w-3.5 h-3.5" />,
          bg: 'bg-purple-50 border-purple-200 text-purple-800',
          dot: 'bg-purple-600',
        };
    }
  };

  const badge = getTypeBadge();

  // Format date readable
  const formattedDate = (() => {
    try {
      const parts = item.data.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        return d.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
      }
      return item.data;
    } catch {
      return item.data;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#343A40]/75 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Top Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-[#FCFAFA]">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
              >
                <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {item.status && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-700 uppercase">
                  {item.status}
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-xl font-black text-[#343A40] tracking-tight break-words">
              {item.titulo}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Date & Time */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#C76B4A] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Data & Periodicidade
                </span>
                <span className="font-bold text-[#343A40] capitalize block">{formattedDate}</span>
                <div className="flex items-center gap-1 text-gray-500 mt-0.5">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>
                    {item.dia_inteiro
                      ? 'Dia Inteiro'
                      : item.horario_fim
                      ? `${item.horario_inicio} às ${item.horario_fim}`
                      : `A partir das ${item.horario_inicio}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Location or Meet Link */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#355C7D] flex items-center justify-center shrink-0">
                {item.link_reuniao ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Local / Conexão
                </span>
                <span className="font-bold text-[#343A40] truncate block">
                  {item.local || (item.link_reuniao ? 'Reunião Online' : 'Todas as Unidades')}
                </span>
                {item.link_reuniao ? (
                  <a
                    href={item.link_reuniao}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[#2E7D32] hover:underline font-bold mt-0.5"
                  >
                    <span>Entrar na Chamada</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                ) : (
                  <span className="text-[11px] text-gray-500 block">Presencial / Operação</span>
                )}
              </div>
            </div>

            {/* Unit / Scope */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#8B6B4A] flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Unidade / Abrangência
                </span>
                <span className="font-bold text-[#343A40] truncate block">
                  {item.unidade_nome || 'Todas as Unidades da Rede'}
                </span>
                <span className="text-[11px] text-gray-500 block">
                  {item.rawEvent?.publico_tipo === 'TODOS' ? 'Público Geral' : 'Operações Segmentadas'}
                </span>
              </div>
            </div>

            {/* Responsible Leader */}
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 text-[#343A40] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Responsável / Convocação
                </span>
                <span className="font-bold text-[#343A40] truncate block">
                  {item.lider_nome || item.rawEvent?.criado_por_nome || 'Diretoria / Central'}
                </span>
                <span className="text-[11px] text-gray-500 block">Liderança Operacional</span>
              </div>
            </div>
          </div>

          {/* Description Section */}
          {item.descricao && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-[#343A40] uppercase tracking-wider">
                Orientações & Detalhamento
              </h4>
              <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 leading-relaxed">
                {item.descricao}
              </div>
            </div>
          )}

          {/* Quick Action Buttons for Tasks / Reports */}
          {item.rawTask && onOpenTask && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="font-bold text-xs text-blue-950 block">
                    Vínculo Operacional: {item.rawTask.numero_os}
                  </span>
                  <span className="text-[11px] text-blue-800">
                    Status: <strong>{item.rawTask.status}</strong> • Prioridade:{' '}
                    <strong>{item.rawTask.prioridade}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenTask(item.rawTask!);
                }}
                className="px-4 py-2 bg-[#355C7D] hover:bg-[#2b4c68] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Abrir e Executar OS</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {item.rawReport && onOpenReport && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-bold text-xs text-amber-950 block">
                    Documento Corporativo: {item.rawReport.titulo}
                  </span>
                  <span className="text-[11px] text-amber-800">
                    Período: {item.rawReport.periodo} • {item.rawReport.total_leituras} leituras registradas
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenReport(item.rawReport!);
                }}
                className="px-4 py-2 bg-[#D97706] hover:bg-[#b45309] text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <span>Visualizar Relatório</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Integrated Comments Thread */}
          <div className="pt-2">
            <CommentsThread
              itemTipo={commentTargetType}
              itemId={commentItemId}
              itemTitulo={item.titulo}
              compact={false}
              showHeader={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
