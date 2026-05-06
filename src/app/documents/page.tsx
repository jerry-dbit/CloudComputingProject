'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { FileText, Upload, Search, Grid, List, Trash2, Eye } from 'lucide-react';
import { formatFileSize, formatDate } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import type { Document } from '@/types';

export default function DocumentsPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pdf' | 'docx' | 'txt'>('all');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function loadDocuments() {
    if (!user) return;
    setError(null);
    const res = await fetch(`/api/documents?ownerId=${encodeURIComponent(user.id)}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      setError('Failed to load documents');
      return;
    }
    const data = (await res.json()) as Document[];
    setDocuments(data);
  }

  useEffect(() => {
    if (!user) return;
    void loadDocuments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filteredDocuments = useMemo(
    () =>
      documents.filter((doc) => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'all' || doc.fileType === filterType;
        return matchesSearch && matchesType;
      }),
    [documents, filterType, searchQuery]
  );

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    }
  }

  async function handleFileUpload(file: File) {
    const validExt = ['pdf', 'docx', 'doc', 'txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    if (!validExt.includes(ext)) {
      setError('Invalid file type. Use PDF, DOCX, DOC or TXT.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError('File size too large. Maximum is 50MB.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    const timer = setInterval(() => {
      setUploadProgress((prev) => Math.min(95, prev + 10));
    }, 150);

    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(timer);

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string };
        setError(payload.error || 'Upload failed');
        return;
      }

      const created = (await res.json()) as Document;
      setUploadProgress(100);
      setDocuments((prev) => [created, ...prev]);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 300);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Documents</h1>
          <p className="text-[var(--text-secondary)] mt-1">Upload and collaborate on study files</p>
        </div>
        <div className="inline-flex">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleFileUpload(file);
              }
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }}
          />
          <Button 
            className="gap-2" 
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </div>

      {uploading && (
        <Card className="p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-2">Uploading file...</p>
          <div className="w-full h-2 rounded-full bg-[var(--surface-dark)] overflow-hidden">
            <div
              className="h-full bg-[var(--primary)] transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-red-500/40">
          <p className="text-sm text-red-400">{error}</p>
        </Card>
      )}

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--surface-dark)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['all', 'pdf', 'docx', 'txt'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === type
                  ? 'bg-[var(--primary)] text-white'
                  : 'bg-[var(--surface)] border border-[var(--surface-dark)] text-[var(--text-secondary)]'
              }`}
            >
              {type.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg border border-[var(--surface-dark)] p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${
              viewMode === 'grid'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${
              viewMode === 'list'
                ? 'bg-[var(--primary)] text-white'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} hover>
              <div className="aspect-[4/3] bg-[var(--surface-dark)] rounded-lg mb-4 flex items-center justify-center">
                <FileText className="w-12 h-12 text-[var(--text-muted)]" />
              </div>
              <h3 className="font-medium text-[var(--text-primary)] truncate">{doc.title}</h3>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={doc.fileType === 'pdf' ? 'info' : 'success'}>
                  {doc.fileType.toUpperCase()}
                </Badge>
                <span className="text-xs text-[var(--text-secondary)]">
                  {formatFileSize(doc.fileSize)}
                </span>
                <span className="text-xs text-[var(--text-secondary)] ml-auto">
                  {formatDate(doc.updatedAt)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--surface-dark)] flex items-center gap-2">
                <Link href={`/documents/${doc.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Eye className="w-3 h-3" />
                    Open
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => void handleDelete(doc.id)}>
                  <Trash2 className="w-4 h-4 text-[var(--danger)]" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[var(--surface-dark)] rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-[var(--text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{doc.title}</p>
                <p className="text-sm text-[var(--text-secondary)] truncate">{doc.fileName}</p>
              </div>
              <Badge variant={doc.fileType === 'pdf' ? 'info' : 'success'}>
                {doc.fileType.toUpperCase()}
              </Badge>
              <span className="w-24 text-sm text-[var(--text-secondary)]">
                {formatFileSize(doc.fileSize)}
              </span>
              <span className="w-28 text-sm text-[var(--text-secondary)]">
                {formatDate(doc.updatedAt)}
              </span>
              <Link href={`/documents/${doc.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="w-4 h-4" />
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={() => void handleDelete(doc.id)}>
                <Trash2 className="w-4 h-4 text-[var(--danger)]" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
