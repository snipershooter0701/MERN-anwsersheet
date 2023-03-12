const YearModel = require("../models/YearModel");
const SubjectModel = require("../models/SubjectModel");
const TopicModel = require("../models/TopicModel");
const SubTopicModel = require("../models/SubTopicModel");

const fetchById = async (req, res) => {
    try {
        let { id } = req.params;
        let topic = await SubTopicModel.findById(id);
        res.json({
            success: true,
            data: topic
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const fetchBySlug = async (req, res) => {
    try {
        let { year_slug, subject_slug, topic_slug, subtopic_slug } = req.query;
        let year = await YearModel.findOne({ slug: year_slug }).select("_id");
        let subject = await SubjectModel.findOne({ year: year._id, slug: subject_slug }).select("_id");
        let topic = await TopicModel.findOne({ subject: subject._id, slug: topic_slug }).select("_id");
        let subtopic = await SubTopicModel.findOne({ topic: topic._id, slug: subtopic_slug });
        res.json({
            success: true,
            data: subtopic
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

module.exports = {
    fetchById,
    fetchBySlug
}