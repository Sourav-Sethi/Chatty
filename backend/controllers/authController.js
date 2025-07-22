import { generateToken } from "../lib/utils.js";
import Users from "../models/userModels.js"
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js"
import speakeasy from "speakeasy";

export const signup = async(req,res) => {
    const {fullName, email, password} = req.body;
    try {
        if(password.length<6){
            return res.status(404).json({message:"Password must be atleast 6 characters long"});
        }
        if(!password || !fullName || !email){
            return res.status(404).json({message:"All fields are required"});
        }
        const user = await Users.findOne({email}).lean();
        if(user){
            return res.status(404).json({message:"Email already exists"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);
        const newuser = new Users({
            fullName,email,
            password:hashedPassword
        })
        if(newuser){
            const token = generateToken(newuser._id,res);
            await newuser.save();
            res.status(201).json({
                _id:newuser._id,
                fullName:newuser.fullName,
                email:newuser.email,
                profilePic:newuser.profilePic,
                token:token
            })
        }
        else{
            return res.status(404).json({message:"Failed to create user"});
        }
    } catch (error) {
        console.log("Error in signup",error.message);
        res.status(500).json({message:"Internal server error"});
    }
}
export const login = async(req,res) => {
    const {email,password} = req.body;
    try {
        const user = await Users.findOne({email});
        if(!user){
            return res.status(404).json({message:"Email does not exist"});
        }
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(404).json({message:"Invalid password"});
        }
        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic
        })
    } catch (error) {
        console.log("Error in login Controller: ",error.message);
        res.status(500).json({message:"Internal Server Error"})
    }
}
export const logout = (req,res) => {
    try{
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message:"Logout Successfull"});
        req.headers['token'] = null;
    }
    catch(error){
        console.log("Error in logout controller: ",error.message);
        res.status(500).json({message:"Internal Server Error"})
    }
}

export const updateProfile = async(req,res) =>{
    try {
        const { profilePic, status } = req.body;
        const userID = req.user._id;
        let updateFields = {};
        if (profilePic) {
            const uploadResponse = await cloudinary.uploader.upload(profilePic);
            updateFields.profilePic = uploadResponse.secure_url;
        }
        if (typeof status === "string") {
            updateFields.status = status;
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({message:"No profile fields to update"});
        }
        const updtaedUser = await Users.findByIdAndUpdate(userID, updateFields, {new:true,select: "-password -__v"});
        res.status(200).json(updtaedUser)
    } catch (error) {
        console.log("Error in update Profile:",error.message)
        res.status(500).json({message:"Internal Server error in profile updation"})
    }
}

export const checkAuth = (req,res)=>{
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log("Error in checkAuth Controller",error.message)
        res.status(500).json({message:"Internal Server error in CheckAuth Controller"})
    }
}

export const blockUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const { blockId } = req.body;
        if (userId.toString() === blockId) return res.status(400).json({ message: "Cannot block yourself" });
        const user = await Users.findById(userId);
        if (!user.blockedUsers.includes(blockId)) {
            user.blockedUsers.push(blockId);
            await user.save();
        }
        res.status(200).json({ success: true, blockedUsers: user.blockedUsers });
    } catch (error) {
        res.status(500).json({ message: "Failed to block user" });
    }
};

export const unblockUser = async (req, res) => {
    try {
        const userId = req.user._id;
        const { blockId } = req.body;
        const user = await Users.findById(userId);
        user.blockedUsers = user.blockedUsers.filter(id => id.toString() !== blockId);
        await user.save();
        res.status(200).json({ success: true, blockedUsers: user.blockedUsers });
    } catch (error) {
        res.status(500).json({ message: "Failed to unblock user" });
    }
};

export const reportUser = async (req, res) => {
    try {
        // For demo, just log the report. In production, store in DB for admin review.
        const { reportId, reason } = req.body;
        console.log(`User ${req.user._id} reported ${reportId}: ${reason}`);
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to report user" });
    }
};

export const enable2FA = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        const secret = speakeasy.generateSecret({ length: 20 });
        user.twoFactorSecret = secret.base32;
        user.twoFactorEnabled = true;
        await user.save();
        res.status(200).json({ otpauth_url: secret.otpauth_url, base32: secret.base32 });
    } catch (error) {
        res.status(500).json({ message: "Failed to enable 2FA" });
    }
};

export const disable2FA = async (req, res) => {
    try {
        const user = await Users.findById(req.user._id);
        user.twoFactorEnabled = false;
        user.twoFactorSecret = "";
        await user.save();
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to disable 2FA" });
    }
};

export const verify2FA = async (req, res) => {
    try {
        const { code } = req.body;
        const user = await Users.findById(req.user._id);
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: "base32",
            token: code,
        });
        if (!verified) return res.status(400).json({ message: "Invalid 2FA code" });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ message: "Failed to verify 2FA" });
    }
};