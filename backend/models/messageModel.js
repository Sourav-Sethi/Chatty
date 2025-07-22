import mongoose from "mongoose"
const messageSchema = new mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String
    },
    image:{
        type:String
    },
    fileUrl: {
        type: String,
        default: null
    },
    fileType: {
        type: String,
        default: null
    },
    fileName: {
        type: String,
        default: null
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group",
        default: null
    },
    read: {
        type: Boolean,
        default: false
    },
    reactions: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: String
        }
    ],
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "UserMsg",
        default: null
    },
},
{timestamps:true}
)

const UsersMsg = mongoose.model("UserMsg",messageSchema);
export default UsersMsg;
