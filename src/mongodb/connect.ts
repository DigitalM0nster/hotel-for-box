import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/h4b";

export const connectDB = async () => {
    if (mongoose.connections[0].readyState) return;
    await mongoose.connect(MONGODB_URI);
};
