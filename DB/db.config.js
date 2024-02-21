import mongoose from 'mongoose';

 const mongooseConnection = async()=>{
    try {
        mongoose.connect(process.env.DATABASE_URL)
        .then(() => console.log('Connected!'));
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1) 
    }
 }
 mongooseConnection()
 

export default mongooseConnection;