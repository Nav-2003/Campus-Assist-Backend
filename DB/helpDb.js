import mongoose from "mongoose";

const helpDbSchema = new mongoose.Schema(
    {
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RequestRoom",
            required: true
        },
        helpedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserCampus",
            required: true
        },
    },
    {
        timestamps: true
    }
);

const HelpDb = mongoose.model("HelpDb", helpDbSchema);

export default HelpDb;