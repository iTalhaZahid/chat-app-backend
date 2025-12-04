import dotenv from 'dotenv';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import { registerUserEvents } from './userEvents.js';
dotenv.config();

export default function initializeSocketServer(server) {
    //socket io instance
    const io = new SocketIOServer(server, {
        cors: {
            origin: '*', // Allow all origins (you can restrict this in production)
            methods: ['GET', 'POST']
        }
    });

    //authentication middleware

    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error('Authentication error: Invalid token'));
            }

            //attach user data to socket object
            let userData = decoded.user;
            socket.data = userData;
            socket.data.userId = userData.id;
            next();
        });
    });

    //handle socket connection
    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.data.userId}`);
       
        //register user events
        registerUserEvents(io, socket);

        //handle socket disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${socket.data.userId}`);
        });
    });



    return io;
}