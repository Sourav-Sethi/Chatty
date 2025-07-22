import mongoose from "mongoose"

const userSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    fullName:{
        type:String,
        required:true
    },
    password:{  
        type:String,
        required:true,
        minLength:6
    },
    profilePic:{
        type:String,
        default:""
    },
    status: {
        type: String,
        default: ""
    },
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserData" }],
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String, default: "" },
},
{timestamps:true}
);

const Users = mongoose.model("UserData",userSchema);

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  avatar: { type: String, default: "" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "UserData" }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "UserData" },
}, { timestamps: true });

const Group = mongoose.model("Group", groupSchema);

const gameStatsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "UserData", unique: true },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  draws: { type: Number, default: 0 },
  achievements: [{ type: String }],
}, { timestamps: true });

const GameStats = mongoose.model("GameStats", gameStatsSchema);

export { Group, GameStats };
export default Users;

// Users is what we access and UserData is what mongoDB stores