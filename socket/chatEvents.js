import { Server as SocketIOServer, Socket } from 'socket.io';
import Conversation from '../models/Conversation.js';

export function registerChatEvents(io, socket) {
    // Implement chat-related socket events here

    socket.on("newConversation", async (data) => {
        // Handle new conversation logic here
        console.log(`new conversation with data:`, data);

        try {

            if (data.type === 'direct') {
                // Check if a direct conversation already exists between the two users
                const existingConversation = await Conversation.findOne({
                    type: 'direct',
                    participants: { $all: data.participants, $size: 2 }
                }).populate({
                    path: 'participants',
                    select: 'name avatar email' // Select only necessary fields
                }).lean();

                if (existingConversation) {
                    socket.emit("newConversation", {
                        success: true,
                        data: { ...existingConversation, isNew: false }
                    });
                    return; // Exit early since conversation already exists
                }
            }

            //DONE: Create new conversation

            const conversation = await Conversation.create({
                type: data.type,
                participants: data.participants,
                name: data.name || "",     //can be empty for direct
                avatar: data.avatar || "", 
                createdBy: socket.data.userId
            });

            //get all connected sockets of each participant and make them join the room

            const connectedSockets = Array.from(io.sockets.sockets.values()).filter(s => data.participants.includes(s.data.userId));


            //join the conversation room
            connectedSockets.forEach(s => {
                s.join(conversation._id.toString());
            });

            //send back the new conversation details to frontend

            const populatedConversation = await Conversation.findById(conversation._id).populate({
                path: 'participants',
                select: 'name avatar email'
            }).lean();

            if (!populatedConversation) {
                throw new Error("Conversation not found after creation");
            }


            //send to all participants
            io.to(conversation._id.toString()).emit("newConversation", {
                success: true,
                data: { ...populatedConversation, isNew: true }
            });

        } catch (error) {
            console.log("New Conversation Error", error);
            socket.emit("newConversation", {
                success: false,
                msg: error?.message || "Error creating new conversation"
            });
        }
    })
}