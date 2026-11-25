
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
        categories: {
            type: [{ type: String, enum: [
                "Food & canteen", "Print & stationery", "Notes & study",
                "Medicine / first aid", "Campus errand", "Ride / drop", "Other favour"
            ] }],
            default: []
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
            default:null
        },
        review: {
            rating: { type: Number, min: 1, max: 5 },
            feedback: { type: String, trim: true, maxlength: 600 },
            createdAt: { type: Date }
        },
        messages: [{
            sender: { type: mongoose.Schema.Types.ObjectId, ref: "UserCampus" },
            name: { type: String, required: true },
            text: { type: String, required: true, maxlength: 500 },
            createdAt: { type: Date, default: Date.now }
        }],
        tracking: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "UserCampus", required: true },
            latitude: { type: Number, required: true, min: -90, max: 90 },
            longitude: { type: Number, required: true, min: -180, max: 180 },
            accuracy: { type: Number, min: 0 },
            updatedAt: { type: Date, default: Date.now }
        }]
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
