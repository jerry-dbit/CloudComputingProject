'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Document as PdfDocument, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Button, Badge, Card } from '@/components/ui';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Trash2,
} from 'lucide-react';
import { HIGHLIGHT_COLORS, formatDateTime } from '@/lib/utils';
import type { Document as StudyDoc, Highlight, HighlightColor } from '@/types';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const CURRENT_USER = {
  userId: 'user-1',
  username: 'John Doe',
  avatar: '',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function DocumentViewerPage() {
  const params = useParams<{ id: string }>();
  const documentId = params.id;

  const [doc, setDoc] = useState<StudyDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [selectedColor, setSelectedColor] = useState<HighlightColor>('yellow');

  const [docxText, setDocxText] = useState('');
  const [txtText, setTxtText] = useState('');

  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [selectionRect, setSelectionRect] = useState<{
    xPct: number;
    yPct: number;
    widthPct: number;
    heightPct: number;
    text: string;
  } | null>(null);

  const [cursors, setCursors] = useState<
    Array<{
      userId: string;
      username: string;
      x: number;
      y: number;
    }>
  >([]);

  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const cursorTickRef = useRef<number | null>(null);

  async function loadDocument() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/documents/${documentId}`, { cache: 'no-store' });
    if (!res.ok) {
      setError('Document not found');
      setLoading(false);
      return;
    }

    const payload = (await res.json()) as StudyDoc;
    setDoc(payload);
    setHighlights(payload.highlights || []);
    setLoading(false);
  }

  async function loadTextIfNeeded(nextDoc: StudyDoc) {
    if (nextDoc.fileType === 'txt' || nextDoc.fileType === 'docx' || nextDoc.fileType === 'doc') {
      const res = await fetch(`/api/documents/${documentId}/file?format=text`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const text = await res.text();
        if (nextDoc.fileType === 'txt') {
          setTxtText(text);
        } else {
          setDocxText(text);
        }
      }
    }
  }

  async function pollCollab() {
    const res = await fetch(`/api/collab/document/${documentId}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = (await res.json()) as {
      highlights: Highlight[];
      cursors: Array<{ userId: string; username: string; x: number; y: number }>;
    };

    setHighlights(data.highlights || []);
    setCursors((data.cursors || []).filter((c) => c.userId !== CURRENT_USER.userId));
  }

  useEffect(() => {
    void loadDocument();
    const id = window.setInterval(() => {
      void pollCollab();
    }, 1500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId]);

  useEffect(() => {
    if (doc) {
      void loadTextIfNeeded(doc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc?.id]);

  function onTextSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setSelectionRect(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const container = pageContainerRef.current?.getBoundingClientRect();

    if (!container || rect.width < 4 || rect.height < 4) {
      setSelectionRect(null);
      return;
    }

    const xPct = clamp(((rect.left - container.left) / container.width) * 100, 0, 100);
    const yPct = clamp(((rect.top - container.top) / container.height) * 100, 0, 100);
    const widthPct = clamp((rect.width / container.width) * 100, 0, 100 - xPct);
    const heightPct = clamp((rect.height / container.height) * 100, 0, 100 - yPct);

    setSelectionRect({
      xPct,
      yPct,
      widthPct,
      heightPct,
      text: selection.toString().trim(),
    });
  }

  async function saveHighlight() {
    if (!selectionRect || !doc) return;

    const res = await fetch(`/api/documents/${documentId}/highlights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: CURRENT_USER.userId,
        username: CURRENT_USER.username,
        color: selectedColor,
        text: selectionRect.text,
        position: {
          page: pageNumber,
          xPct: selectionRect.xPct,
          yPct: selectionRect.yPct,
          widthPct: selectionRect.widthPct,
          heightPct: selectionRect.heightPct,
        },
      }),
    });

    if (res.ok) {
      const created = (await res.json()) as Highlight;
      setHighlights((prev) => [...prev, created]);
      setSelectionRect(null);
      window.getSelection()?.removeAllRanges();
    }
  }

  async function removeHighlight(highlightId: string) {
    const res = await fetch(
      `/api/documents/${documentId}/highlights?highlightId=${encodeURIComponent(highlightId)}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    }
  }

  async function postCursor(x: number, y: number) {
    await fetch(`/api/collab/document/${documentId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: CURRENT_USER.userId,
        username: CURRENT_USER.username,
        avatar: CURRENT_USER.avatar,
        x,
        y,
      }),
    });
  }

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = pageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);

    if (cursorTickRef.current) window.clearTimeout(cursorTickRef.current);
    cursorTickRef.current = window.setTimeout(() => {
      void postCursor(x, y);
    }, 120);
  }

  const pageHighlights = useMemo(
    () => highlights.filter((h) => h.position.page === pageNumber),
    [highlights, pageNumber]
  );

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading document...</div>;
  }

  if (!doc || error) {
    return <div className="text-red-400">{error || 'Document unavailable'}</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">{doc.title}</h1>
            <Badge variant={doc.fileType === 'pdf' ? 'info' : 'success'}>
              {doc.fileType.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(50, z - 10))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[var(--text-secondary)] w-12 text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(220, z + 10))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Card className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[var(--text-secondary)]">Highlight color:</span>
            {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-7 h-7 rounded border-2 ${
                  selectedColor === color ? 'border-[var(--text-primary)]' : 'border-transparent'
                }`}
                style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
              />
            ))}
            {selectionRect && (
              <Button size="sm" className="ml-2 gap-1" onClick={() => void saveHighlight()}>
                <Highlighter className="w-4 h-4" />
                Save Highlight
              </Button>
            )}
          </div>
        </Card>

        <div
          ref={pageContainerRef}
          onMouseUp={onTextSelection}
          onMouseMove={onMouseMove}
          className="relative bg-[var(--surface)] border border-[var(--surface-dark)] rounded-xl p-4 min-h-[70vh] overflow-auto"
        >
          {doc.fileType === 'pdf' ? (
            <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}>
              <PdfDocument
                file={`/api/documents/${documentId}/file`}
                onLoadSuccess={(result) => {
                  setNumPages(result.numPages);
                  if (pageNumber > result.numPages) setPageNumber(1);
                }}
                onLoadError={() => setError('Failed to render PDF')}
              >
                <Page pageNumber={pageNumber} renderTextLayer renderAnnotationLayer />
              </PdfDocument>
            </div>
          ) : (
            <div
              className="prose prose-invert max-w-none whitespace-pre-wrap text-[var(--text-primary)]"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
            >
              {doc.fileType === 'txt' ? txtText : docxText}
            </div>
          )}

          {pageHighlights.map((h) => (
            <div
              key={h.id}
              className="absolute border border-black/10"
              style={{
                left: `${h.position.xPct}%`,
                top: `${h.position.yPct}%`,
                width: `${h.position.widthPct}%`,
                height: `${h.position.heightPct}%`,
                backgroundColor: HIGHLIGHT_COLORS[h.color].bg,
              }}
            />
          ))}

          {selectionRect && (
            <div
              className="absolute border border-[var(--primary)]"
              style={{
                left: `${selectionRect.xPct}%`,
                top: `${selectionRect.yPct}%`,
                width: `${selectionRect.widthPct}%`,
                height: `${selectionRect.heightPct}%`,
                backgroundColor: `${HIGHLIGHT_COLORS[selectedColor].bg}88`,
              }}
            />
          )}

          {cursors.map((c) => (
            <div
              key={c.userId}
              className="absolute pointer-events-none"
              style={{ left: `${c.x}%`, top: `${c.y}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <div className="mt-1 text-[10px] px-1 rounded bg-[var(--primary)] text-white whitespace-nowrap">
                {c.username}
              </div>
            </div>
          ))}
        </div>

        {doc.fileType === 'pdf' && (
          <div className="flex justify-center items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[var(--text-secondary)]">
              Page {pageNumber} of {numPages || 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={numPages === 0 || pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4 h-fit sticky top-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-3">Highlights</h2>
        <div className="space-y-3 max-h-[70vh] overflow-auto">
          {highlights.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No highlights yet.</p>
          ) : (
            highlights.map((h) => (
              <div key={h.id} className="p-3 rounded border border-[var(--surface-dark)]">
                <div className="flex items-start gap-2">
                  <div
                    className="w-3 h-3 rounded mt-1"
                    style={{ backgroundColor: HIGHLIGHT_COLORS[h.color].bg }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] line-clamp-3">{h.text || '(no text)'}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {h.username} - p.{h.position.page} - {formatDateTime(h.createdAt)}
                    </p>
                  </div>
                  {h.userId === CURRENT_USER.userId && (
                    <button
                      onClick={() => void removeHighlight(h.id)}
                      className="text-[var(--danger)]"
                      title="Delete highlight"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

export default DocumentViewerPage;
