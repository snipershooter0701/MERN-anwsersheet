const mongoose = require('mongoose');
const TransactionModel = require('./TransactionModel');
const InvoiceModel = require("./InvoiceModel");

const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        match: /.+\@.+\..+/,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: Boolean,
        default: false
    },
    role: {
        type: Number,
        default: 0
    }
 }, {
    timestamps: true
 });

 UserSchema.pre("findOneAndDelete", async function(next) {
    let id = this._conditions._id;
    await TransactionModel.deleteMany({user: id});
    await InvoiceModel.deleteMany({user: id});
    next();
});
const User = mongoose.model('User', UserSchema);

module.exports = User;