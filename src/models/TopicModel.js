const mongoose = require("mongoose");

const TopicSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    }, 
    slug: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    module: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module'
    },
    subTopics: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubTopic'
    }]
}, {
    timestamps: true
});

const Topic = mongoose.model('Topic', TopicSchema);

module.exports = Topic;