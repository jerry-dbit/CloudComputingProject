'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Badge, Card, Avatar, Input } from '@/components/ui';
import { Users, MessageSquare, Play, Pause, RotateCcw, FileText, Send, LogOut, Timer } from 'lucide-react';
import type { ChatMessage, CursorPosition, StudyRoom } from '@/types';
import { socketClient } from '@/lib/realtime/socket-client';

const CURRENT_USER = {
  userId: 'user-1',
  username: 'John Doe',
  avatar: '',
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function RoomPage() {
  const params = useParams<{ id: string }>();
  const roomId = params.id;

  const [room, setRoom] = useState<StudyRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60);
  const [pomodoroType, setPomodoroType] = useState<'work' | 'break'>('work');
  const [cycles, setCycles] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const cursorTickRef = useRef<number | null>(null);

  async function loadInitialData() {
    const [roomRes, messageRes] = await Promise.all([
      fetch(`/api/rooms/${roomId}`, { cache: 'no-store' }),
      fetch(`/api/rooms/${roomId}/messages`, { cache: 'no-store' }),
    ]);

    if (roomRes.ok) {
      setRoom((await roomRes.json()) as StudyRoom);
    } else {
      setError('Room not found');
    }

    if (messageRes.ok) {
      setMessages((await messageRes.json()) as ChatMessage[]);
    }
  }

  useEffect(() => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

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
      body: JSON.stringify({ ...CURRENT_USER, text }),
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
      body: JSON.stringify({ userId: CURRENT_USER.userId }),
    });
    window.location.href = '/rooms';
  }

  async function postCursor(x: number, y: number) {
    socketClient.getSocket().emit('cursor-move', {
      ...CURRENT_USER,
      x,
      y,
      roomId,
      updatedAt: new Date().toISOString(),
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
    () => cursors.filter((cursor) => cursor.userId !== CURRENT_USER.userId),
    [cursors]
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
          <div className="absolute top-4 left-4 z-10">
            {room.currentDocumentId ? (
              <Link href={`/documents/${room.currentDocumentId}`}>
                <Button variant="outline" size="sm" className="gap-1">
                  <FileText className="w-4 h-4" />
                  Open Shared Document
                </Button>
              </Link>
            ) : (
              <Badge>No shared document</Badge>
            )}
          </div>

          <div className="h-full p-8 pt-16">
            <div className="max-w-3xl mx-auto bg-[var(--surface)] p-8 shadow-sm min-h-[500px] border border-[var(--surface-dark)] rounded-lg">
              <p className="text-[var(--text-primary)]">
                This room supports real-time chat, participant presence, cursor sync, and shared document access.
              </p>
              <p className="text-[var(--text-secondary)] mt-2">
                Use the "Open Shared Document" button to collaborate on highlights in real-time.
              </p>
            </div>
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
              {p.userId !== CURRENT_USER.userId && <div className="w-2 h-2 bg-[var(--accent)] rounded-full" title="Online" />}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-[var(--surface-dark)]">
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
            <div key={msg.id} className={`flex gap-3 ${msg.userId === CURRENT_USER.userId ? 'flex-row-reverse' : ''}`}>
              <Avatar fallback={msg.username.slice(0, 2)} size="sm" />
              <div className={`flex-1 ${msg.userId === CURRENT_USER.userId ? 'text-right' : ''}`}>
                <div
                  className={`inline-block p-3 rounded-lg ${
                    msg.userId === CURRENT_USER.userId
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
    </div>
  );
}
