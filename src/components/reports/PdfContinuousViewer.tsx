import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

// Configure worker using official CDN matching installed pdfjs-dist version
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
}

interface PdfContinuousViewerProps {
  pdfSource: string;
  zoomLevel: number;
  reportTitle?: string;
}

interface PageData {
  pageNumber: number;
  width: number;
  height: number;
  isLandscape: boolean;
}

export const PdfContinuousViewer: React.FC<PdfContinuousViewerProps> = ({
  pdfSource,
  zoomLevel,
  reportTitle,
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pagesData, setPagesData] = useState<PageData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const canvasRefs = useRef<{ [pageIndex: number]: HTMLCanvasElement | null }>({});

  // Helper to convert base64/DataURI to Uint8Array
  const getPdfData = (source: string): Uint8Array | string => {
    if (source.startsWith('data:application/pdf;base64,')) {
      const base64 = source.replace('data:application/pdf;base64,', '');
      const binaryString = window.atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;
    }
    return source;
  };

  // 1. Load the PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setPagesData([]);
    setNumPages(0);

    const loadDocument = async () => {
      try {
        const data = getPdfData(pdfSource);
        const loadingTask = pdfjsLib.getDocument(
          typeof data === 'string' ? { url: data } : { data }
        );

        const pdfDoc = await loadingTask.promise;
        if (isCancelled) return;

        pdfDocRef.current = pdfDoc;
        const total = pdfDoc.numPages;
        setNumPages(total);

        // Extract metadata for each page (dimensions, orientation)
        const pagesMeta: PageData[] = [];
        for (let i = 1; i <= total; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          pagesMeta.push({
            pageNumber: i,
            width: viewport.width,
            height: viewport.height,
            isLandscape: viewport.width > viewport.height,
          });
        }

        if (!isCancelled) {
          setPagesData(pagesMeta);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('Erro ao carregar PDF:', err);
        if (!isCancelled) {
          setError(err?.message || 'Não foi possível carregar o arquivo PDF.');
          setLoading(false);
        }
      }
    };

    if (pdfSource) {
      loadDocument();
    } else {
      setLoading(false);
      setError('Nenhum documento PDF fornecido.');
    }

    return () => {
      isCancelled = true;
    };
  }, [pdfSource]);

  // 2. Render Canvas for each Page whenever pagesData or zoomLevel changes
  useEffect(() => {
    if (!pdfDocRef.current || pagesData.length === 0 || loading) return;

    let isCancelled = false;

    const renderAllPages = async () => {
      const pdfDoc = pdfDocRef.current;
      if (!pdfDoc) return;

      for (let i = 0; i < pagesData.length; i++) {
        if (isCancelled) break;
        const pageMeta = pagesData[i];
        const canvas = canvasRefs.current[pageMeta.pageNumber];
        if (!canvas) continue;

        try {
          const page = await pdfDoc.getPage(pageMeta.pageNumber);
          if (isCancelled) break;

          // Determine scale: base high-dpi scale * zoomLevel
          const dpr = window.devicePixelRatio || 1;
          const userScale = zoomLevel / 100;
          // Scale viewport to maintain crisp text rendering on high-DPI
          const scale = 1.5 * userScale * (dpr > 1 ? 1.25 : 1);
          const viewport = page.getViewport({ scale });

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          // CSS display size based on page's natural proportions and zoom
          const displayWidth = pageMeta.width * userScale;
          const displayHeight = pageMeta.height * userScale;

          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;

          const context = canvas.getContext('2d');
          if (context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
            };
            await page.render(renderContext).promise;
          }
        } catch (renderErr) {
          console.error(`Erro renderizando página ${pageMeta.pageNumber}:`, renderErr);
        }
      }
    };

    renderAllPages();

    return () => {
      isCancelled = true;
    };
  }, [pagesData, zoomLevel, loading]);

  if (loading) {
    return (
      <div className="w-full py-20 flex flex-col items-center justify-center text-stone-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#C76B4A]" />
        <p className="text-xs font-semibold">Renderizando documento PDF...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-xl bg-rose-950/40 border border-rose-800 rounded-2xl p-6 text-center text-rose-200 space-y-3 mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <h4 className="font-bold text-sm text-white">Falha ao abrir visualização contínua do PDF</h4>
        <p className="text-xs text-rose-300">{error}</p>
        <p className="text-[11px] text-stone-400">
          O documento está preservado no sistema e disponível para confirmação de leitura.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full flex flex-col items-center gap-8 py-2 print:gap-4 print:py-0"
    >
      {/* List of continuous PDF Pages */}
      {pagesData.map((page) => (
        <div
          key={page.pageNumber}
          className="relative flex flex-col items-center group pdf-page-container w-full print:w-full print:block print:my-3 print:break-inside-avoid print:page-break-inside-avoid"
        >
          {/* Page Card Container with dynamic portrait/landscape dimensions */}
          <div
            className="bg-white rounded-lg shadow-2xl overflow-hidden border border-stone-300 transition-all print:shadow-none print:border-none print:rounded-none print:w-full"
            style={{
              maxWidth: '100%',
            }}
          >
            {/* Page Header Strip with page indicator */}
            <div className="px-4 py-1.5 bg-stone-100/90 border-b border-stone-200 text-stone-500 flex items-center justify-between text-[11px] font-mono select-none print:bg-white print:border-stone-300 print:text-stone-700">
              <span className="font-semibold text-stone-700">
                Página {page.pageNumber} de {numPages}
              </span>
              <span className="text-[10px] text-stone-400">
                {page.isLandscape ? 'Formato Paisagem (Horizontal)' : 'Formato Retrato (Vertical)'}
              </span>
            </div>

            {/* Page Canvas Render */}
            <div className="flex justify-center bg-white p-2 sm:p-4 overflow-x-auto max-w-full print:p-0 print:overflow-visible">
              <canvas
                ref={(el) => {
                  canvasRefs.current[page.pageNumber] = el;
                }}
                className="block max-w-full h-auto print:w-full print:max-w-full"
              />
            </div>
          </div>
        </div>
      ))}

      {/* End of PDF document marker */}
      <div className="w-full max-w-3xl flex items-center gap-4 my-4 select-none print:hidden">
        <div className="flex-1 h-px bg-stone-700/80"></div>
        <div className="flex items-center gap-2 px-3 py-1 bg-stone-800/80 border border-stone-700 rounded-full text-[11px] font-bold text-stone-400">
          <FileText className="w-3.5 h-3.5 text-[#C76B4A]" />
          <span>Fim do Documento PDF ({numPages} {numPages === 1 ? 'página' : 'páginas'})</span>
        </div>
        <div className="flex-1 h-px bg-stone-700/80"></div>
      </div>
    </div>
  );
};
