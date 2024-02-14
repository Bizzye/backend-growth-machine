import mongoose from 'mongoose';
import { configs } from '../enums/config.enum';

const connectDB = async () => {
    try {
        const c = await mongoose.connect(configs.link);
        
        console.log(`MongoDB connected: ${c.connection.host}`);
    } catch (error: any) {
        console.log(`Error: ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;