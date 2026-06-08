const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const ProfileSchema = new mongoose.Schema({
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: '' },
    lastName: { type: String, required: true, trim: true },
    birthday: { type: Date, required: true },
    phone: { 
        type: String, 
        required: true, 
        trim: true, 
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number'] 
    }
}, { _id: false });

const UserSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true, 
        lowercase: true, 
        trim: true, 
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'] 
    },
    password: { type: String, required: true },
    profile: { type: ProfileSchema, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' }
}, { timestamps: true });

// Virtual for full name
ProfileSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`.trim();
});

// PASSWORD SECURITY: Hash before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// PASSWORD SECURITY: Comparison method
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);