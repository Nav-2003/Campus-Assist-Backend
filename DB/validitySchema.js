import mongoose from "mongoose";

const validitySchema=new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    expiresAt: {
        type: Date,
        required: true,
        index: true,
        expires: 0
    }
});


const validityDb=new mongoose.model("validityDb",validitySchema);

export default validityDb;