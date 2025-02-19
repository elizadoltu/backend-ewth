import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String, 
        required: true,
    },
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true, 
    },
});

const tokenModel = mongoose.model('RefreshToken', refreshTokenSchema);
export default tokenModel;