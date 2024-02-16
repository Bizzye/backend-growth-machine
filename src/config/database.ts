import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        const c = await mongoose.connect(process.env.LINK);
        
        console.log(`MongoDB connected: ${c.connection.host}`);
    } catch (error: any) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;