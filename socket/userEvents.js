
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
 
    socket.on("getContacts", async () => {
        try {
            //Check authenticated user

            const currentUserId = socket.data.userId;
            if (!currentUserId) {
                socket.emit('getContacts', {
                    success: false,
                    message: 'User not authenticated'
                });
                return;
            }
            // Fetch all users except the current user

            const users = await User.find(
                { _id: { $ne: currentUserId } },
                { password: 0 } //exclude password field
            ).lean();      //lean() to get plain JS objects instead of Mongoose documents
            
            const contacts = users.map((user) => ({
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
            }));

            socket.emit('getContacts', {
                success: true,
                data: contacts
            });

        } catch (error) {
            console.error("getContacts error:", error);
            return socket.emit('getContacts', {
                success: false,
                message: error?.message || 'Error fetching contacts'
            });
        }
    });

}