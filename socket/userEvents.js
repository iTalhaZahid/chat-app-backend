// import { Server as SocketIOServer, Socket } from 'socket.io';
import User from '../models/User.js';
import { generateToken } from '../utils/token.js';

export function registerUserEvents(io, socket) {
    // Test event
    socket.on('testSocket', (data) => {
        socket.emit('testSocketResponse', { message: 'Test socket event received', data });
    });

    socket.on("updateProfile", async (data) => {
        // Handle profile update logic here
        console.log(`updated profile with data:`, data);

        const userId = socket.data.userId;
        if (!userId) {
            return socket.emit('updateProfile', { success: false, message: 'User not authenticated' });
        }

        try {

            //Profile update operation
            const updatedUser = await User.findByIdAndUpdate(userId, { name: data.name, avatar: data.avatar },
                { new: true }); //will return the updated document
            if (!updatedUser) {
                return socket.emit('updateProfile', { success: false, message: 'User not found' });
            }


            //get token with updated user data

            const newToken = generateToken(updatedUser)

            socket.emit('updateProfile', {
                success: true, message: 'Profile updated successfully', data: { token: newToken },
                msg: "Profile updated successfully"

            });
        }
        catch (error) {
            console.error("updateProfile error:", error);
            return socket.emit('updateProfile', {
                success: false,
                message: error?.message || 'Error Updating Profile'
            });
        }
    });
}