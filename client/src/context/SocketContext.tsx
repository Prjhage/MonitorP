'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const socketRef = useRef<Socket | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        // Create singleton socket — only once for the entire app
        const s = io(SOCKET_URL, {
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
        });
        socketRef.current = s;
        setSocket(s);

        s.on('connect', () => console.log('[Socket] Connected:', s.id));
        s.on('disconnect', (reason) => console.warn('[Socket] Disconnected:', reason));
        s.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

        return () => {
            s.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
