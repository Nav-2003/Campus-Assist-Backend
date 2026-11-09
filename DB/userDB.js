import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phoneNo:{
      type:String,
      required:true
    },
    passwordHash: {
        type: String,
        required: true
    },
    refreshTokenHash: {
        type: String,
        default: null
    }
});

const User= mongoose.model("UserCampus", userSchema);
export default User