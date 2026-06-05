const mongoose = require('mongoose');

// Profile subdocument schema
const ProfileSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    middleName: {
        type: String,
        trim: true,
        default: ''
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    birthday: {
        type: Date,
        required: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+?[1-9]\d{1,14}$/, 'Please provide a valid phone number']
    }
}, { 
    _id: false // Prevents Mongoose from generating an automatic _id for this subdocument
});

// Main user schema
const UserSchema = new mongoose.Schema({
    // Auth credentials
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: true
    },

    // Personal details module
    profile: {
        type: ProfileSchema,
        required: true
    },

    // Authorization & permissions
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { timestamps: true });

// Virtual property for retrieving full name dynamically
ProfileSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.middleName ? this.middleName + ' ' : ''}${this.lastName}`;
});

module.exports = mongoose.model('User', UserSchema);

