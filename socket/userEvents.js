import {Server as SocketIOServer, Socket} from 'socket.io';

export function registerUserEvents(io, socket) {
    // Example event: Join a room
    socket.on('testSocket', (data) => {
        socket.emit('testSocketResponse', { message: 'Test socket event received', data });
    });
}