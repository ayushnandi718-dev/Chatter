import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

 export async function connectDB(){
 try {
    const mongoUri = process.env.MONGO_URI;

    if(!mongoUri){
        throw new Error("MONGO_URI is not defined in environment variables");
    }

    await mongoose.connect(mongoUri)

    const conn = await mongoose.connect(mongoUri)
    
    console.log("MongoDB connected successfully",conn.connection.host);
 } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1); // Exit the process with failure
 }
}