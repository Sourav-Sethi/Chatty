import userModel from "../models/userModels.js"
import msgModel from "../models/messageModel.js"
import cloudinary from "../lib/cloudinary.js"
import { getRecieverSocketId , io } from "../lib/socket.js";
import { Group, GameStats } from "../models/userModels.js";
import mongoose from 'mongoose';

export const getUsersForSidebar=async(req,res)=>{
    try {
        // console.log("user: ",req.user)
        const loggedInUserId = req.user._id;
        const filterNonLogInUsers = await userModel.find({_id:{$ne:loggedInUserId}}).select("-password");
        res.status(200).json(filterNonLogInUsers);
    } catch (error) {
        console.error("Error in getUserForSidebar conotroller: ",error.message)
        res.status(500).json({error:"Internal Server error in getUserForSidebar conotroller"})
    }
}

export const getMessages = async(req,res)=>{
    try {
        const {id:userToChatId} = req.params;
        const MyId = req.user._id;
        // Only proceed if userToChatId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userToChatId)) {
            return res.status(400).json({error: "Invalid user ID"});
        }
        const messages = await msgModel.find({
            $or:[
                {senderId:MyId,receiverId:userToChatId},
                {senderId:userToChatId,receiverId:MyId}
            ]
        })
        // Mark all messages from userToChatId to MyId as read
        await msgModel.updateMany(
            { senderId: userToChatId, receiverId: MyId, read: false },
            { $set: { read: true } }
        );
        res.status(200).json(messages)
    } catch (error) {
        console.error(error);
        console.error("Error in getMessages conotroller: ",error.message)
        res.status(500).json({error:"Internal Server error in getMessages conotroller"})
    }
}

export const sendMessages = async(req,res)=>{
    try {
        const {text, image, file, fileType, fileName, replyTo} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id
        
        // Prevent blocked users from sending messages
        const receiver = await userModel.findById(receiverId);
        if (receiver.blockedUsers.includes(senderId)) {
            return res.status(403).json({ error: "You are blocked by this user." });
        }
        
        let imageUrl;
        let fileUrl = null;
        let fileTypeStored = null;
        let fileNameStored = null;
        if(image){
            // uploading image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;           
        }
        if(file && fileType && fileName) {
            if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
                // Upload to Cloudinary
                const uploadResponse = await cloudinary.uploader.upload(file, { resource_type: fileType.startsWith('video/') ? 'video' : 'image' });
                fileUrl = uploadResponse.secure_url;
            } else {
                // For other files, store as base64 URL (for demo; in production, use S3 or similar)
                fileUrl = file;
            }
            fileTypeStored = fileType;
            fileNameStored = fileName;
        }
        const message = new msgModel({
            senderId,
            receiverId,
            text,
            image: imageUrl,
            fileUrl,
            fileType: fileTypeStored,
            fileName: fileNameStored,
            replyTo: replyTo || null
        })
        await message.save();
        const recieverSocketId = getRecieverSocketId(receiverId)

        // if(recieverSocketId) i.e reciever is online because io.emit bradcast to all client therefore using io.to(recieverId).emit
        if(recieverSocketId){
            io.to(recieverSocketId).emit("newMessage",message)
        }
       
        res.status(201).json(message)
    } catch (error) {
       console.error("Error in sendMessages controller: ",error.message)
        res.status(500).json({error:"Internal Server error in sendMessages conotroller"})
    }
}

export const markMessagesAsRead = async (req, res) => {
    try {
        const { id: userId } = req.params;
        const myId = req.user._id;
        await msgModel.updateMany(
            { senderId: userId, receiverId: myId, read: false },
            { $set: { read: true } }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error in markMessagesAsRead controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in markMessagesAsRead controller" });
    }
};

export const addReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;
        const userId = req.user._id;
        // Remove previous reaction by this user (if any)
        const message = await msgModel.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
        // Add new reaction
        message.reactions.push({ userId, emoji });
        await message.save();
        res.status(200).json(message);
    } catch (error) {
        console.error("Error in addReaction controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in addReaction controller" });
    }
};

export const removeReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const message = await msgModel.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        message.reactions = message.reactions.filter(r => r.userId.toString() !== userId.toString());
        await message.save();
        res.status(200).json(message);
    } catch (error) {
        console.error("Error in removeReaction controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in removeReaction controller" });
    }
};

export const editMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { text } = req.body;
        const userId = req.user._id;
        const message = await msgModel.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.senderId.toString() !== userId.toString()) return res.status(403).json({ error: "Not authorized" });
        message.text = text;
        await message.save();
        res.status(200).json(message);
    } catch (error) {
        console.error("Error in editMessage controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in editMessage controller" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;
        const message = await msgModel.findById(messageId);
        if (!message) return res.status(404).json({ error: "Message not found" });
        if (message.senderId.toString() !== userId.toString()) return res.status(403).json({ error: "Not authorized" });
        await message.deleteOne();
        res.status(200).json({ success: true, messageId });
    } catch (error) {
        console.error("Error in deleteMessage controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in deleteMessage controller" });
    }
};

export const createGroup = async (req, res) => {
    try {
        const { name, avatar, members } = req.body;
        const createdBy = req.user._id;
        if (!name || !Array.isArray(members) || members.length < 2) {
            return res.status(400).json({ error: "Group name and at least 2 members required" });
        }
        const group = new Group({ name, avatar, members: [...members, createdBy], createdBy });
        await group.save();
        res.status(201).json(group);
    } catch (error) {
        console.error("Error in createGroup controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in createGroup controller" });
    }
};

export const getGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        const groups = await Group.find({ members: userId });
        res.status(200).json(groups);
    } catch (error) {
        console.error("Error in getGroups controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in getGroups controller" });
    }
};

export const sendGroupMessage = async (req, res) => {
    try {
        const { text, image, file, fileType, fileName, replyTo } = req.body;
        const { groupId } = req.params;
        const senderId = req.user._id;
        let imageUrl;
        let fileUrl = null;
        let fileTypeStored = null;
        let fileNameStored = null;
        if (image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        if (file && fileType && fileName) {
            if (fileType.startsWith('image/') || fileType.startsWith('video/')) {
                const uploadResponse = await cloudinary.uploader.upload(file, { resource_type: fileType.startsWith('video/') ? 'video' : 'image' });
                fileUrl = uploadResponse.secure_url;
            } else {
                fileUrl = file;
            }
            fileTypeStored = fileType;
            fileNameStored = fileName;
        }
        const message = new msgModel({
            senderId,
            groupId,
            text,
            image: imageUrl,
            fileUrl,
            fileType: fileTypeStored,
            fileName: fileNameStored,
            replyTo: replyTo || null
        });
        await message.save();
        // TODO: Emit to group members via socket
        res.status(201).json(message);
    } catch (error) {
        console.error("Error in sendGroupMessage controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in sendGroupMessage controller" });
    }
};

export const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const messages = await msgModel.find({ groupId });
        res.status(200).json(messages);
    } catch (error) {
        console.error("Error in getGroupMessages controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in getGroupMessages controller" });
    }
};

export const recordGameResult = async (req, res) => {
    try {
        const { userId, result, achievement } = req.body; // result: 'win' | 'loss' | 'draw'
        let stats = await GameStats.findOne({ userId });
        if (!stats) {
            stats = new GameStats({ userId });
        }
        if (result === 'win') stats.wins += 1;
        if (result === 'loss') stats.losses += 1;
        if (result === 'draw') stats.draws += 1;
        if (achievement && !stats.achievements.includes(achievement)) {
            stats.achievements.push(achievement);
        }
        await stats.save();
        res.status(200).json(stats);
    } catch (error) {
        console.error("Error in recordGameResult controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in recordGameResult controller" });
    }
};

export const getLeaderboard = async (req, res) => {
    try {
        const leaderboard = await GameStats.find().sort({ wins: -1, draws: -1, losses: 1 }).limit(20).populate('userId', 'fullName profilePic');
        res.status(200).json(leaderboard);
    } catch (error) {
        console.error("Error in getLeaderboard controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in getLeaderboard controller" });
    }
};

export const getUserAchievements = async (req, res) => {
    try {
        const userId = req.user._id;
        const stats = await GameStats.findOne({ userId });
        res.status(200).json(stats?.achievements || []);
    } catch (error) {
        console.error("Error in getUserAchievements controller: ", error.message);
        res.status(500).json({ error: "Internal Server error in getUserAchievements controller" });
    }
};