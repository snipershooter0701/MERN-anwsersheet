const mongoose = require("mongoose");

const SubjectSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    icon: {
        type: String
    },
    year: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Year'
    },
    modules: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    }]
}, {
    timestamps: true
});

const Subject = mongoose.model('Subject', SubjectSchema);

module.exports = Subject;