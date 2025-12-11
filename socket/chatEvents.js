import { Server as SocketIOServer, Socket } from 'socket.io';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export function registerChatEvents(io, socket) {
    // Implement chat-related socket events here

    //New Conversation 

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

            //create new conversation document
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
    });

    //Fetch Conversations
    socket.on("getConversations", async () => {
        console.log("Fetch Conversation event");
        try {
            const userId = socket.data.userId;
            if (!userId) {
                socket.emit('getConversations', {
                    success: false,
                    msg: "Unauthorized"
                });
                return;
            }

            // Fetch conversations where the user is a participant
            const conversations = await Conversation.find({
                participants: userId
            }).sort({ updatedAt: -1 }) // Sort by last updated
                .populate({
                    path: 'lastMessage',
                    select: "content senderId attachment createdAt",
                })
                .populate({
                    path: 'participants',
                    select: 'name avatar email'
                }).lean();

            socket.emit('getConversations', {
                success: true,
                data: conversations
            });
        } catch (error) {
            console.log("Fetch Conversation", error);
            socket.emit('getConversations', {
                success: false,
                msg: error?.message || "Error fetching conversations"
            });
        }
    });





    socket.on("newMessage", async (data) => {
        // Handle new message logic here
        // const senderId = socket.data.userId;          // sender from auth
        // const conversationId = data.conversationId;   // from client

        try {
            const message = await Message.create({
                conversationId: data.conversationId,
                // senderId: senderId.toString(),
                senderId: data.sender.id,
                content: data.content,
                attachment: data.attachment
            });
            // io.to(data.conversationId.toString()).emit("newMessage", {
            //     success: true,
            //     data: {
            //         id: message._id,
            //         content: data.content,
            //         sender: {
            //             id: senderId.toString(),
            //             name: data.sender.name,
            //             avatar: data.sender.avatar
            //         }
            //     },
            //     attachment: data.attachment,
            //     createdAt: new Date().toISOString(),
            //     conversationId,
            // });

            io.to(data.conversationId.toString()).emit("newMessage", {
                success: true,
                data: {
                    id: message._id,
                    content: data.content,
                    sender: {
                        id: data.sender.id,
                        name: data.sender.name,
                        avatar: data.sender.avatar,
                    },
                    attachment: data.attachment,
                    createdAt: new Date().toISOString(),
                    conversationId: data.conversationId,
                },
            });


            //Update last message in conversation
            await Conversation.findByIdAndUpdate(data.conversationId, {
                lastMessage: message._id,
            });

        } catch (error) {
            console.log("New Message Error", error);
            socket.emit("newMessage", {
                success: false,
                msg: error?.message || "Failed to send message"
            });
        }
    });


    socket.on("getMessages", async (data) => {
        // Handle new message logic here
        // const senderId = socket.data.userId;          // sender from auth
        // const conversationId = data.conversationId;   // from client

        try {
            const messages = await Message.find({ conversationId: data.conversationId })
                .sort({ createdAt: -1 }) // Sort by creation time descending
                .populate({
                    path: 'senderId',
                    select: 'name avatar '
                }).lean();

            const messagesWithSender = messages.map(message => ({
                ...message,
                id: message._id,
                sender: {
                    id: message.senderId._id,
                    name: message.senderId.name,
                    avatar: message.senderId.avatar
                }
            }))

            socket.emit("getMessages", {
                success: true,
                data: messagesWithSender,
            });
        } catch (error) {
            console.log("getMessages Message Error", error);
            socket.emit("getMessages", {
                success: false,
                msg: error?.message || "Failed to fetch message"
            });
        }
    });
}