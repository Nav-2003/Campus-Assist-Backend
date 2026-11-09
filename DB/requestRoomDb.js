
import mongoose from "mongoose";

const requestRoomSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000
        },

        address: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            required: true,
            enum: [
                "Food & canteen",
                "Print & stationery",
                "Notes & study",
                "Medicine / first aid",
                "Campus errand",
                "Ride / drop",
                "Other favour"
            ]
        },

        tip: {
            type: Number,
            default: 0,
            min: 0
        },

        urgency: {
            type: String,
            enum: ["Whenever", "Soon", "Urgent"],
            default: "Soon"
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserCampus",
            required: true
        },

        status: {
            type: String,
            enum: ["Open", "Joined", "Completed", "Cancelled","Coming","Parchasing"],
            default: "Open"
        },
        helpBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "UserCampus",
            default:none
        }
    },
    {
        timestamps: true
    }
);

const RequestRoom = mongoose.model(
    "RequestRoom",
    requestRoomSchema
);

export default RequestRoom;
