import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const socketClient = {
  getSocket: () => {
    if (!socket) {
      // In production, we might need to pass the URL if it's not the same host
      socket = io();
    }
    return socket;
  },
  disconnect: () => {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  }
};
