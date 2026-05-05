'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, Button, Badge, Modal, Input, Avatar } from '@/components/ui';
import { Users, Plus, Search, Lock, Unlock, BookOpen } from 'lucide-react';
import type { StudyRoom } from '@/types';

const CURRENT_USER = {
  userId: 'user-1',
  username: 'John Doe',
};

export default function RoomsPage() {
  const [rooms, setRooms] = useState<StudyRoom[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomSubject, setNewRoomSubject] = useState('');
  const [newRoomMaxParticipants, setNewRoomMaxParticipants] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function loadRooms() {
    setError(null);
    const res = await fetch('/api/rooms', { cache: 'no-store' });
    if (!res.ok) {
      setError('Failed to load rooms');
      return;
    }
    setRooms((await res.json()) as StudyRoom[]);
  }

  useEffect(() => {
    void loadRooms();
  }, []);

  const filteredRooms = useMemo(
    () =>
      rooms.filter(
        (room) =>
          room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
          room.code.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [rooms, searchQuery]
  );

  async function handleCreateRoom() {
    if (!newRoomName.trim() || !newRoomSubject.trim()) return;

    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newRoomName,
        subject: newRoomSubject,
        maxParticipants: newRoomMaxParticipants,
        ownerId: CURRENT_USER.userId,
        ownerName: CURRENT_USER.username,
      }),
    });

    if (!res.ok) {
      const payload = (await res.json()) as { error?: string };
      setError(payload.error || 'Failed to create room');
      return;
    }

    const created = (await res.json()) as StudyRoom;
    setRooms((prev) => [created, ...prev]);
    setIsCreateModalOpen(false);
    setNewRoomName('');
    setNewRoomSubject('');
  }

  async function handleJoinRoomById(roomId: string) {
    const res = await fetch(`/api/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(CURRENT_USER),
    });
    if (res.ok) {
      window.location.href = `/rooms/${roomId}`;
      return;
    }
    const payload = (await res.json()) as { error?: string };
    setError(payload.error || 'Failed to join room');
  }

  async function handleJoinByCode() {
    const room = rooms.find((r) => r.code === joinCode.toUpperCase());
    if (!room) {
      setError('Room not found for that code');
      return;
    }
    await handleJoinRoomById(room.id);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">Study Rooms</h1>
          <p className="text-[var(--text-secondary)] mt-1">Join or create rooms to study together</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setIsJoinModalOpen(true)} className="gap-2">
            <Unlock className="w-4 h-4" />
            Join Room
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Room
          </Button>
        </div>
      </div>

      {error && <Card className="text-sm text-red-400">{error}</Card>}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Search rooms by name, subject, or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--surface-dark)] bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRooms.map((room) => (
          <Card key={room.id} hover>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-[var(--secondary)]/10 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[var(--secondary)]" />
              </div>
              <Badge variant={room.isActive ? 'success' : 'default'}>
                {room.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">{room.name}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">{room.subject}</p>

            <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mb-4">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>
                  {room.participants.length}/{room.maxParticipants}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-4 h-4" />
                <span>{room.code}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-[var(--surface-dark)]">
              <div className="flex -space-x-2">
                {room.participants.slice(0, 3).map((p) => (
                  <Avatar
                    key={p.userId}
                    fallback={p.username.slice(0, 2)}
                    size="sm"
                    className="ring-2 ring-[var(--surface)]"
                  />
                ))}
                {room.participants.length > 3 && (
                  <div className="w-8 h-8 rounded-full bg-[var(--surface-dark)] flex items-center justify-center text-xs text-[var(--text-secondary)] ring-2 ring-[var(--surface)]">
                    +{room.participants.length - 3}
                  </div>
                )}
              </div>
              <Button className="ml-auto" size="sm" onClick={() => void handleJoinRoomById(room.id)}>
                Join
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create Study Room">
        <div className="space-y-4">
          <Input
            label="Room Name"
            placeholder="e.g., Algorithms Study Group"
            value={newRoomName}
            onChange={(e) => setNewRoomName(e.target.value)}
          />
          <Input
            label="Subject"
            placeholder="e.g., Computer Science"
            value={newRoomSubject}
            onChange={(e) => setNewRoomSubject(e.target.value)}
          />
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Max Participants
            </label>
            <input
              type="range"
              min="2"
              max="20"
              value={newRoomMaxParticipants}
              onChange={(e) => setNewRoomMaxParticipants(parseInt(e.target.value, 10))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[var(--text-secondary)] mt-1">
              <span>2</span>
              <span>Current: {newRoomMaxParticipants}</span>
              <span>20</span>
            </div>
          </div>
          <Button onClick={() => void handleCreateRoom()} className="w-full">
            Create Room
          </Button>
        </div>
      </Modal>

      <Modal isOpen={isJoinModalOpen} onClose={() => setIsJoinModalOpen(false)} title="Join Study Room">
        <div className="space-y-4">
          <Input
            label="Room Code"
            placeholder="Enter 6-character code"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <Button
            onClick={() => void handleJoinByCode()}
            className="w-full"
            disabled={!joinCode.trim()}
          >
            Join Room
          </Button>
        </div>
      </Modal>
    </div>
  );
}
