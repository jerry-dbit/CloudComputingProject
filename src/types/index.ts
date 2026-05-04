export interface User {
  id: string;
  email: string;
  username: string;
  avatar: string;
  createdAt: string;
  lastLogin: string;
}

export interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: 'pdf' | 'docx' | 'doc' | 'txt';
  fileSize: number;
  storageUrl: string;
  storagePath?: string;
  pageCount?: number;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  highlights: Highlight[];
  annotations: Annotation[];
}

export interface Highlight {
  id: string;
  documentId: string;
  userId: string;
  username: string;
  color: HighlightColor;
  text: string;
  position: HighlightPosition;
  createdAt: string;
}

export type HighlightColor = 'yellow' | 'green' | 'pink' | 'blue';

export interface HighlightPosition {
  page: number;
  xPct: number;
  yPct: number;
  widthPct: number;
  heightPct: number;
}

export interface Annotation {
  id: string;
  highlightId: string;
  userId: string;
  text: string;
  replies: AnnotationReply[];
  createdAt: string;
  resolved: boolean;
}

export interface AnnotationReply {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  subject: string;
  code: string;
  ownerId: string;
  maxParticipants: number;
  currentDocumentId: string | null;
  participants: Participant[];
  createdAt: string;
  isActive: boolean;
}

export interface Participant {
  userId: string;
  username: string;
  avatar: string;
  joinedAt: string;
  isOwner: boolean;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export interface CursorPosition {
  userId: string;
  username: string;
  avatar: string;
  x: number;
  y: number;
  roomId: string;
  updatedAt: string;
}

export interface StudyflowDb {
  documents: Document[];
  rooms: StudyRoom[];
  messages: ChatMessage[];
}
