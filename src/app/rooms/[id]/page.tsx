'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
<<<<<<< HEAD
import { Button, Badge, Card, Avatar, Input } from '@/components/ui';
import { Users, MessageSquare, Play, Pause, RotateCcw, FileText, Send, LogOut, Timer } from 'lucide-react';
import type { ChatMessage, CursorPosition, StudyRoom } from '@/types';
import { socketClient } from '@/lib/realtime/socket-client';

const CURRENT_USER = {
  userId: 'user-1',
  username: 'John Doe',
  avatar: '',
};
=======
import { Button, Badge, Card, Avatar, Input, Modal } from '@/components/ui';
import { Users, MessageSquare, Play, Pause, RotateCcw, FileText, Send, LogOut, Timer, Share2, Check, ExternalLink, Presentation } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import type { ChatMessage, CursorPosition, StudyRoom, Document } from '@/types';
>>>>>>> de28076 (:))

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function RoomPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [myDocuments, setMyDocuments] = useState<Document[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);

  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroType, setPomodoroType] = useState<'work' | 'break'>('work');
  const [cycles, setCycles] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const cursorTickRef = useRef<number | null>(null);

<<<<<<< HEAD
  async function loadInitialData() {
    const [roomRes, messageRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}`, { cache: 'no-store' }),
      fetch(`/api/rooms/${roomId}/messages`, { cache: 'no-store' }),
=======
  async function loadRoomData() {
    const [roomRes, messageRes, collabRes, documentsRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}`, { cache: 'no-store' }),
      fetch(`/api/rooms/${roomId}/messages`, { cache: 'no-store' }),
      fetch(`/api/collab/room/${roomId}`, { cache: 'no-store' }),
      fetch('/api/documents', { cache: 'no-store' }),
>>>>>>> de28076 (:))
    ]);

    let allDocuments: Document[] = [];
    if (documentsRes.ok && user) {
      allDocuments = (await documentsRes.json()) as Document[];
    }

    if (roomRes.ok) {
      const fetchedRoom = (await roomRes.json()) as StudyRoom;
      setRoom(fetchedRoom);

      const sharedIds = new Set(fetchedRoom.sharedDocumentIds ?? []);
      const roomDocs = allDocuments.filter((doc) => sharedIds.has(doc.id));
      setSharedDocuments(roomDocs);

      if (roomDocs.length === 0) {
        setActiveDocumentId(null);
      } else if (
        fetchedRoom.currentDocumentId &&
        roomDocs.some((doc) => doc.id === fetchedRoom.currentDocumentId)
      ) {
        setActiveDocumentId(fetchedRoom.currentDocumentId);
      } else {
        setActiveDocumentId(roomDocs[0].id);
      }
    } else {
      setError('Room not found');
    }

    if (user) {
      setMyDocuments(allDocuments.filter((doc) => doc.ownerId === user.id));
    }

    if (messageRes.ok) {
      setMessages((await messageRes.json()) as ChatMessage[]);
    }
  }

  useEffect(() => {
<<<<<<< HEAD
    void loadInitialData();

    const socket = socketClient.getSocket();
    socket.emit('join-room', roomId);

    socket.on('update-cursors', (data: CursorPosition) => {
      setCursors((prev) => {
        const next = prev.filter((c) => c.userId !== data.userId);
        next.push(data);
        return next;
      });
    });

    socket.on('new-message', (data: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === data.id)) return prev;
        return [...prev, data];
      });
    });

    return () => {
      socket.off('update-cursors');
      socket.off('new-message');
    };
=======
    if (!user) return;
    void loadRoomData();
    const id = window.setInterval(() => {
      void loadRoomData();
    }, 1500);
    return () => window.clearInterval(id);
>>>>>>> de28076 (:))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => setPomodoroTime((prev) => prev - 1), 1000);
    } else if (pomodoroTime === 0) {
      if (pomodoroType === 'work') {
        setPomodoroType('break');
        setPomodoroTime(5 * 60);
        setCycles((prev) => prev + 1);
      } else {
        setPomodoroType('work');
        setPomodoroTime(25 * 60);
      }
      setPomodoroActive(false);
    }
    return () => interval && clearInterval(interval);
  }, [pomodoroActive, pomodoroTime, pomodoroType]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  async function handleSendMessage() {
    const text = newMessage.trim();
    if (!text) return;

    const res = await fetch(`/api/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) return;

    const created = (await res.json()) as ChatMessage;
    socketClient.getSocket().emit('send-message', { ...created, roomId });

    setMessages((prev) => [...prev, created]);
    setNewMessage('');
  }

  async function handleLeaveRoom() {
    await fetch(`/api/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    window.location.href = '/rooms';
  }

  async function handleShareDocument(documentId: string) {
    setIsSharing(true);
    setShareError(null);

    const res = await fetch(`/api/rooms/${roomId}/share-documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId }),
    });

    setIsSharing(false);

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setShareError(payload.error || 'Failed to share document');
      return;
    }

    setIsShareModalOpen(false);
    await loadRoomData();
  }

  async function handleSelectSharedDocument(documentId: string) {
    setActiveDocumentId(documentId);
    await fetch(`/api/rooms/${roomId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentDocumentId: documentId }),
    });
  }

  async function postCursor(x: number, y: number) {
<<<<<<< HEAD
    socketClient.getSocket().emit('cursor-move', {
      ...CURRENT_USER,
      x,
      y,
      roomId,
      updatedAt: new Date().toISOString(),
=======
    await fetch(`/api/collab/room/${roomId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y }),
>>>>>>> de28076 (:))
    });
  }

  function onBoardMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 0, 100);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 0, 100);

    if (cursorTickRef.current) {
      window.clearTimeout(cursorTickRef.current);
    }
    cursorTickRef.current = window.setTimeout(() => {
      void postCursor(x, y);
    }, 120);
  }

  const roomCursors = useMemo(
    () => cursors.filter((cursor) => cursor.userId !== user?.id),
    [cursors, user?.id]
  );
  const activeDocument = useMemo(
    () => sharedDocuments.find((doc) => doc.id === activeDocumentId) ?? sharedDocuments[0] ?? null,
    [activeDocumentId, sharedDocuments]
  );

  if (!room) {
    return <div className="text-[var(--text-secondary)]">{error || 'Loading room...'}</div>;
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px_340px] gap-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              ←
            </Button>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] truncate">{room.name}</h1>
            <Badge variant="success">{room.code}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Card className="flex items-center gap-3 px-4 py-2">
              <Timer className="w-5 h-5 text-[var(--secondary)]" />
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{formatTime(pomodoroTime)}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {pomodoroType === 'work' ? 'Focus Time' : 'Break Time'}
                </p>
              </div>
            </Card>
            <Button variant={pomodoroActive ? 'secondary' : 'primary'} size="sm" onClick={() => setPomodoroActive((prev) => !prev)}>
              {pomodoroActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPomodoroTime(pomodoroType === 'work' ? 25 * 60 : 5 * 60);
                setPomodoroActive(false);
              }}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Badge variant="warning">Cycle {cycles}</Badge>
          </div>
        </div>

        <div
          ref={boardRef}
          onMouseMove={onBoardMouseMove}
          className="relative min-h-[72vh] bg-[var(--surface)] rounded-xl border border-[var(--surface-dark)] overflow-hidden"
        >
          <div className="flex items-center justify-between gap-3 p-4 border-b border-[var(--surface-dark)] bg-[var(--surface-dark)]/50">
            <div className="flex items-center gap-2 min-w-0">
              <Presentation className="w-4 h-4 text-[var(--text-secondary)]" />
              <p className="text-sm text-[var(--text-secondary)] truncate">
                {activeDocument ? `${activeDocument.title} is being presented` : 'No document being presented'}
              </p>
            </div>
            {activeDocument && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1 shrink-0"
                onClick={() => window.open(`/documents/${activeDocument.id}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                Open Full View
              </Button>
            )}
          </div>

          <div className="p-4 border-b border-[var(--surface-dark)]">
            {sharedDocuments.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {sharedDocuments.map((doc) => (
                  <Button
                    key={doc.id}
                    variant={activeDocument?.id === doc.id ? 'primary' : 'outline'}
                    size="sm"
                    className="gap-1"
                    onClick={() => void handleSelectSharedDocument(doc.id)}
                  >
                    <FileText className="w-4 h-4" />
                    {doc.title}
                  </Button>
                ))}
              </div>
            ) : (
              <Badge>No shared document</Badge>
            )}
          </div>

          <div className="p-4 h-[calc(72vh-124px)]">
            {activeDocument ? (
              activeDocument.fileType === 'pdf' ? (
                <div className="h-full w-full rounded-lg overflow-hidden border border-[var(--surface-dark)] bg-black">
                  <iframe
                    src={`/api/documents/${activeDocument.id}/file#toolbar=1&navpanes=0&scrollbar=1`}
                    title={activeDocument.title}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="h-full w-full rounded-lg border border-[var(--surface-dark)] bg-[var(--surface)] grid place-items-center p-6 text-center">
                  <div>
                    <p className="text-[var(--text-primary)] font-medium">This shared file is not a PDF preview.</p>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      Open it in full view to collaborate on highlights.
                    </p>
                    <Button
                      className="mt-4 gap-2"
                      onClick={() => window.open(`/documents/${activeDocument.id}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Document
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="h-full w-full rounded-lg border border-dashed border-[var(--surface-dark)] grid place-items-center p-6 text-center">
                <div>
                  <p className="text-[var(--text-primary)] font-medium">Share a document to start presenting.</p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Everyone in this room will see it here live.
                  </p>
                </div>
              </div>
            )}
          </div>

          {roomCursors.map((cursor) => (
            <div
              key={cursor.userId}
              className="absolute pointer-events-none"
              style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-[var(--accent)]" />
              <div className="bg-[var(--primary)] text-white text-xs px-2 py-0.5 rounded mt-1 whitespace-nowrap">
                {cursor.username}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface-dark)] flex flex-col">
        <div className="p-4 border-b border-[var(--surface-dark)]">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <Users className="w-4 h-4" />
            Participants ({room.participants.length})
          </h3>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {room.participants.map((p) => (
            <div key={p.userId} className="flex items-center gap-3">
              <Avatar fallback={p.username.slice(0, 2)} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{p.username}</p>
                <p className="text-xs text-[var(--text-secondary)]">{p.isOwner ? 'Owner' : 'Member'}</p>
              </div>
              {p.userId !== user?.id && <div className="w-2 h-2 bg-[var(--accent)] rounded-full" title="Online" />}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--surface-dark)]">
          <Button variant="secondary" className="w-full gap-2 mb-3" onClick={() => setIsShareModalOpen(true)}>
            <Share2 className="w-4 h-4" />
            Share Document
          </Button>
          <Button variant="danger" className="w-full gap-2" onClick={() => void handleLeaveRoom()}>
            <LogOut className="w-4 h-4" />
            Leave Room
          </Button>
        </div>
      </div>

      <div className="bg-[var(--surface)] rounded-xl border border-[var(--surface-dark)] flex flex-col min-h-[72vh]">
        <div className="p-4 border-b border-[var(--surface-dark)] flex items-center justify-between">
          <h3 className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Chat
          </h3>
          <Badge>{messages.length}</Badge>
        </div>
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.userId === user?.id ? 'flex-row-reverse' : ''}`}>
                <Avatar fallback={msg.username.slice(0, 2)} size="sm" />
                <div className={`flex-1 ${msg.userId === user?.id ? 'text-right' : ''}`}>
                  <div
                    className={`inline-block p-3 rounded-lg ${
                      msg.userId === user?.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'bg-[var(--surface-dark)] text-[var(--text-primary)]'
                    }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 border-t border-[var(--surface-dark)]">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSendMessage();
                }
              }}
            />
            <Button onClick={() => void handleSendMessage()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} title="Share a document to this room">
        <div className="space-y-3">
          {shareError && <p className="text-sm text-red-400">{shareError}</p>}
          {myDocuments.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">Upload a document first, then share it here.</p>
          ) : (
            myDocuments.map((doc) => {
              const alreadyShared = room.sharedDocumentIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[var(--surface-dark)] p-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] truncate">{doc.fileName}</p>
                  </div>
                  <Button
                    size="sm"
                    variant={alreadyShared ? 'outline' : 'primary'}
                    disabled={alreadyShared || isSharing}
                    onClick={() => void handleShareDocument(doc.id)}
                    className="gap-1 shrink-0"
                  >
                    {alreadyShared ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                    {alreadyShared ? 'Shared' : 'Share'}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}
