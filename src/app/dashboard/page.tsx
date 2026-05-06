'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge } from '@/components/ui';
import { FileText, Users, Highlighter, Upload, ArrowRight, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { getDisplayName } from '@/lib/auth';
import type { Document, StudyRoom } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [rooms, setRooms] = useState<StudyRoom[]>([]);

  useEffect(() => {
    void (async () => {
      const [docsRes, roomsRes] = await Promise.all([
        fetch('/api/documents', { cache: 'no-store' }),
        fetch('/api/rooms', { cache: 'no-store' }),
      ]);

      if (docsRes.ok) {
        setDocuments((await docsRes.json()) as Document[]);
      }
      if (roomsRes.ok) {
        setRooms((await roomsRes.json()) as StudyRoom[]);
      }
    })();
  }, []);

  const recentDocuments = useMemo(() => documents.slice(0, 5), [documents]);
  const activeRooms = useMemo(() => rooms.slice(0, 4), [rooms]);
  const highlightCount = useMemo(
    () => documents.reduce((acc, doc) => acc + doc.highlights.length, 0),
    [documents]
  );
  const displayName = getDisplayName(user);

  const stats = [
    { label: 'Documents', value: String(documents.length), icon: FileText, color: 'bg-[var(--primary)]' },
    { label: 'Study Rooms', value: String(rooms.length), icon: Users, color: 'bg-[var(--secondary)]' },
    { label: 'Highlights', value: String(highlightCount), icon: Highlighter, color: 'bg-[var(--accent)]' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Welcome back, {displayName}!</h1>
          <p className="text-[var(--text-secondary)] mt-1">Continue your collaborative study sessions.</p>
        </div>
        <Link href="/documents">
          <Button className="gap-2">
            <Upload className="w-4 h-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Recent Documents</h2>
            <Link href="/documents" className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentDocuments.map((doc) => (
              <Link key={doc.id} href={`/documents/${doc.id}`}>
                <Card hover className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[var(--secondary)]/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-[var(--secondary)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] truncate">{doc.title}</p>
                    <p className="text-sm text-[var(--text-secondary)] flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(doc.updatedAt)}
                    </p>
                  </div>
                  <Badge variant={doc.fileType === 'pdf' ? 'info' : 'success'}>
                    {doc.fileType.toUpperCase()}
                  </Badge>
                </Card>
              </Link>
            ))}
            {recentDocuments.length === 0 && (
              <Card className="text-sm text-[var(--text-secondary)]">No documents yet.</Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">Active Study Rooms</h2>
            <Link href="/rooms" className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeRooms.map((room) => (
              <Link key={room.id} href={`/rooms/${room.id}`}>
                <Card hover>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{room.name}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{room.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                      <Users className="w-4 h-4" />
                      <span className="text-sm">{room.participants.length}</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
            {activeRooms.length === 0 && (
              <Card className="text-sm text-[var(--text-secondary)]">No rooms yet.</Card>
            )}
          </div>
          <Link href="/rooms">
            <Button variant="outline" className="w-full">
              Create New Room
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
