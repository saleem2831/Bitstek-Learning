import mongoose from 'mongoose';
export async function connectDB(){
 if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI is required');
 mongoose.set('bufferCommands',false);
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:5000,socketTimeoutMS:20000});
 console.log('MongoDB connected');
}
