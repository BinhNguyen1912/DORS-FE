import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';
import { WS_NAMESPACES, DISPATCH_EVENTS } from '../constants/websocket.constant';

interface SocketContextType {
  sockets: Record<string, Socket>;
  getSocket: (namespace: string) => Socket | null;
  dispatchSocket: Socket | null;
  notificationSocket: Socket | null;
  joinTeamRoom: (teamId: number) => void;
  updateTeamLocation: (teamId: number, lat: number, lng: number) => void;
}

const SocketContext = createContext<SocketContextType>({
  sockets: {},
  getSocket: () => null,
  dispatchSocket: null,
  notificationSocket: null,
  joinTeamRoom: () => {},
  updateTeamLocation: () => {},
});

export const useSocket = () => useContext(SocketContext);

/**
 * Reusable React Hook to connect / retrieve a specific WebSocket namespace
 */
export const useNamespaceSocket = (namespace: string): Socket | null => {
  const { getSocket } = useSocket();
  return getSocket(namespace);
};

const getSocketBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (!apiUrl) return 'http://localhost:8585';
  try {
    const url = new URL(apiUrl);
    return url.origin;
  } catch (e) {
    return 'http://localhost:8585';
  }
};

const BACKEND_URL = getSocketBaseUrl();

interface NamespaceConfig {
  namespace: string;
  label: string;
  shouldConnect: (user: any, isAuthenticated: boolean) => boolean;
  getQuery: (user: any) => Record<string, string>;
}

/**
 * Centralized Namespace Configs.
 * To scale and add new namespaces (e.g. /tracking or /chat), simply add their connection rule below.
 */
const NAMESPACE_CONFIGS: NamespaceConfig[] = [
  {
    namespace: WS_NAMESPACES.NOTIFICATION,
    label: 'Notification',
    shouldConnect: (user, isAuthenticated) => isAuthenticated && !!user,
    getQuery: (user) => ({
      userId: String(user.id),
      device: 'web',
    }),
  },
  {
    namespace: WS_NAMESPACES.DISPATCH,
    label: 'Dispatch',
    shouldConnect: (user, isAuthenticated) => {
      if (!isAuthenticated || !user) return false;
      const role = user.role;
      return (
        role?.includes('ADMIN') ||
        role === 'SUPER_ADMIN' ||
        role === 'RESCUE_TEAM_LEADER' ||
        role === 'VOLUNTEER'
      );
    },
    getQuery: (user) => ({
      provinceId: user.provinceId ? String(user.provinceId) : '',
      role: user.role || '',
    }),
  },
];

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [sockets, setSockets] = useState<Record<string, Socket>>({});
  const socketsRef = useRef<Record<string, Socket>>({});

  useEffect(() => {
    const activeSockets = socketsRef.current;
    let hasChanges = false;

    NAMESPACE_CONFIGS.forEach((config) => {
      const qualifies = config.shouldConnect(user, isAuthenticated);
      const existingSocket = activeSockets[config.namespace];

      if (qualifies && !existingSocket) {
        const url = `${BACKEND_URL}${config.namespace}`;
        const query = config.getQuery(user);

        console.log(`🔌 [WS] Connecting to ${config.label} namespace at ${config.namespace}...`);
        const socket = io(url, {
          query,
          transports: ['websocket'],
        });

        socket.on('connect', () => {
          console.log(`🟢 [WS] Connected to ${config.label} namespace (${config.namespace})`);
        });

        socket.on('disconnect', (reason) => {
          console.log(`🔴 [WS] Disconnected from ${config.label} namespace (${config.namespace}). Reason: ${reason}`);
        });

        activeSockets[config.namespace] = socket;
        hasChanges = true;
      } else if (!qualifies && existingSocket) {
        console.log(`🔌 [WS] Disconnecting from ${config.label} namespace (${config.namespace}) due to role/auth changes`);
        existingSocket.disconnect();
        delete activeSockets[config.namespace];
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setSockets({ ...activeSockets });
    }

    return () => {
      NAMESPACE_CONFIGS.forEach((config) => {
        const socket = activeSockets[config.namespace];
        if (socket) {
          console.log(`🔌 [WS] Cleaning up ${config.label} namespace connection`);
          socket.disconnect();
          delete activeSockets[config.namespace];
        }
      });
      setSockets({});
    };
  }, [isAuthenticated, user?.id, user?.role, user?.provinceId]);

  const getSocket = (namespace: string): Socket | null => {
    return sockets[namespace] || null;
  };

  const dispatchSocket = getSocket(WS_NAMESPACES.DISPATCH);
  const notificationSocket = getSocket(WS_NAMESPACES.NOTIFICATION);

  const joinTeamRoom = (teamId: number) => {
    const ds = getSocket(WS_NAMESPACES.DISPATCH);
    if (ds && ds.connected) {
      ds.emit(DISPATCH_EVENTS.JOIN_TEAM_ROOM, { teamId });
      console.log(`⚡ [WS] Emit join:team for teamId=${teamId}`);
    }
  };

  const updateTeamLocation = (teamId: number, lat: number, lng: number) => {
    const ds = getSocket(WS_NAMESPACES.DISPATCH);
    if (ds && ds.connected) {
      ds.emit(DISPATCH_EVENTS.UPDATE_TEAM_LOCATION, {
        teamId,
        longitude: lng,
        latitude: lat,
      });
      console.log(`📍 [WS] Emit team:update-location for teamId=${teamId} to (${lng}, ${lat})`);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        sockets,
        getSocket,
        dispatchSocket,
        notificationSocket,
        joinTeamRoom,
        updateTeamLocation,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
