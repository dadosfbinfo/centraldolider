import React, { useState, useEffect, useRef } from 'react';
import { Comentario, CommentTargetType } from '../../types/database';
import { dbStore } from '../../services/dbStore';
import { useAuth } from '../../context/AuthContext';
import {
  MessageSquare,
  Send,
  Shield,
  User,
  Clock,
  CheckCheck,
  CornerDownRight,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface CommentsThreadProps {
  itemTipo: CommentTargetType;
  itemId: string;
  itemTitulo?: string;
  compact?: boolean;
  showHeader?: boolean;
  className?: string;
}

export const CommentsThread: React.FC<CommentsThreadProps> = ({
  itemTipo,
  itemId,
  itemTitulo,
  compact = false,
  showHeader = true,
  className = '',
}) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState<Comentario[]>([]);
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadComments = () => {
    if (!itemId) return;
    const list = dbStore.getComments(itemTipo, itemId);
    setComments(list);
  };

  useEffect(() => {
    loadComments();
    const unsubscribe = dbStore.subscribe(loadComments);
    return () => unsubscribe();
  }, [itemTipo, itemId]);

  // Adjust page to last page when new comments added or keep valid
  const totalPages = Math.max(1, Math.ceil(comments.length / pageSize));
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [totalPages, page]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newText.trim() || !currentUser || isSubmitting) return;

    setIsSubmitting(true);
    try {
      dbStore.addComment({
        autor_id: currentUser.id,
        autor_nome: currentUser.nome,
        autor_role: currentUser.role,
        autor_avatar: currentUser.avatar_url,
        texto: newText.trim(),
        item_tipo: itemTipo,
        item_id: itemId,
      });

      setNewText('');
      // Navigate to last page to see new comment
      const newTotalPages = Math.max(1, Math.ceil((comments.length + 1) / pageSize));
      setPage(newTotalPages);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Erro ao registrar comentário:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatCommentDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      const timeStr = date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (isToday) {
        return `Hoje às ${timeStr}`;
      }

      return `${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} às ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  const targetLabels: Record<CommentTargetType, string> = {
    TAREFA: 'Tarefa / OS',
    META: 'Meta & Indicador',
    RELATORIO: 'Relatório Executivo',
    EVENTO: 'Evento do Calendário',
    CALENDARIO: 'Item da Agenda',
  };

  // Paginate comments
  const paginatedComments = comments.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className={`flex flex-col bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="px-4 py-3 bg-[#FCFAFA] border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#C76B4A]/10 text-[#C76B4A] flex items-center justify-center font-bold">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#343A40] uppercase tracking-wide flex items-center gap-1.5">
                <span>Comunicação & Alinhamento</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono font-bold">
                  {comments.length}
                </span>
              </h4>
              <p className="text-[10px] text-gray-500">
                Canal direto Líder ↔ Administração • {targetLabels[itemTipo]}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 font-medium">
            <CheckCheck className="w-3 h-3 text-emerald-600" />
            <span>Sincronização Ativa</span>
          </div>
        </div>
      )}

      {/* Comments List */}
      <div className={`p-4 overflow-y-auto space-y-3 bg-[#FAF8F5]/40 print:max-h-none print:overflow-visible print:bg-transparent print:p-0 ${compact ? 'max-h-60' : 'max-h-80'}`}>
        {comments.length === 0 ? (
          <div className="text-center py-6 text-gray-400">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300 stroke-1" />
            <p className="text-xs font-medium">Nenhum comentário registrado ainda.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Utilize o campo abaixo para tirar dúvidas ou registrar observações.
            </p>
          </div>
        ) : (
          (typeof document !== 'undefined' && document.body.classList.contains('printing-report') ? comments : paginatedComments).map((comment) => {
            const isMe = currentUser?.id === comment.autor_id;
            const isAdmin = comment.autor_role === 'ADMINISTRADOR';

            return (
              <div
                key={comment.id}
                className={`flex items-start gap-2.5 group ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar / Initials */}
                <div className="shrink-0 mt-0.5">
                  {comment.autor_avatar ? (
                    <img
                      src={comment.autor_avatar}
                      alt={comment.autor_nome}
                      className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] text-white shadow-xs ${
                        isAdmin ? 'bg-[#355C7D]' : 'bg-[#C76B4A]'
                      }`}
                    >
                      {comment.autor_nome.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Comment Body */}
                <div className={`max-w-[82%] sm:max-w-[75%] ${isMe ? 'items-end text-right' : 'items-start text-left'}`}>
                  {/* Meta Bar */}
                  <div className={`flex items-center gap-1.5 mb-1 text-[10px] ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-bold text-[#343A40] truncate max-w-[130px]">
                      {comment.autor_nome}
                    </span>

                    {isAdmin ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#355C7D]/10 text-[#355C7D]">
                        <Shield className="w-2.5 h-2.5" />
                        Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-[#C76B4A]/10 text-[#C76B4A]">
                        <User className="w-2.5 h-2.5" />
                        Líder
                      </span>
                    )}

                    <span className="text-gray-400 font-medium ml-1">
                      {formatCommentDate(comment.created_at)}
                    </span>
                  </div>

                  {/* Speech Bubble */}
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                      isMe
                        ? 'bg-[#C76B4A] text-white rounded-tr-xs'
                        : isAdmin
                        ? 'bg-white border border-[#355C7D]/20 text-[#343A40] rounded-tl-xs'
                        : 'bg-white border border-gray-200 text-[#343A40] rounded-tl-xs'
                    }`}
                  >
                    {comment.texto}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Pagination for comments if > 10 */}
      {comments.length > pageSize && (
        <div className="px-3 py-1.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 print:hidden">
          <span>
            Página <strong>{page}</strong> de <strong>{totalPages}</strong> ({comments.length} comentários)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-1 rounded bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-100 transition"
              title="Comentários anteriores"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-1 rounded bg-white border border-stone-200 disabled:opacity-40 hover:bg-stone-100 transition"
              title="Próximos comentários"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* New Comment Input Box */}
      <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-200 print:hidden">
        <div className="relative flex items-end gap-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={compact ? 2 : 2}
            placeholder={`Escreva uma observação ou tire uma dúvida sobre ${itemTitulo ? `"${itemTitulo}"` : 'este item'}...`}
            className="flex-1 p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-[#343A40] placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C76B4A]/30 focus:border-[#C76B4A] resize-none transition-all"
          />

          <button
            type="submit"
            disabled={!newText.trim() || isSubmitting}
            className="p-2.5 bg-[#C76B4A] hover:bg-[#b05c3d] disabled:opacity-40 disabled:hover:bg-[#C76B4A] text-white rounded-xl font-bold flex items-center justify-center transition-colors shadow-xs shrink-0"
            title="Enviar Comentário (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-1.5 flex items-center justify-between text-[10px] text-gray-400 px-1">
          <span className="flex items-center gap-1">
            <CornerDownRight className="w-2.5 h-2.5 text-gray-400" />
            <span>Pressione <strong>Enter</strong> para enviar</span>
          </span>
          <span>Visível para a Diretoria e Líderes designados</span>
        </div>
      </form>
    </div>
  );
};
