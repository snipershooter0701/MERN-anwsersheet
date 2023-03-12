const mongoose = require('mongoose');

const YearSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
    },
    slug: {
        type: String,
        required: true,
    },
    image: {
        type: String,
    },
    description: {
        type: String
    },
    subjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }] 
}, {
    timestamps: true
});

const Year = mongoose.model('Year', YearSchema);

module.exports = Year;