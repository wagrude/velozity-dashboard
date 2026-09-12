import { io, type Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

let socket: Socket | null = null;

export function connectSocket(accessToken: string) {
  if (socket) {
    socket.auth = {
      token: accessToken,
    };

    if (!socket.connected) {
      socket.connect();
    }

    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: {
      token: accessToken,
    },
    withCredentials: true,
  });

  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
