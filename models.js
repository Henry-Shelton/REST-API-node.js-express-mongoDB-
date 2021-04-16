//this stores the user info in the session
var mongoose = require('mongoose');

mongoose.model('User', new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    subscriptionId: String, //if customer wants to change plan or cancel it - on a plan
    customerId: String, //if customer makes multiple purchases recognise same acc - on a plan
    subscriptionActive: {
        type: Boolean,
        default: false
    },
    created: {
        type: Date,
        default: Date.now
    },
    expire_at: {
        default: Date.now() + ( 3600 * 1000 * 24 * 7),
        expireAfterSeconds: '3600',
        type: Date
    }
}));

const User = mongoose.model('User');
module.exports = User;