const TopicModel = require("../../models/TopicModel");
const SubTopicModel = require("../../models/SubTopicModel");
const { slugify } = require("../../services/helper");

const fetch = async (req, res) => {
    let { search, length, page, sortKey, sortDir } = req.query;
    let sort = {};
    if (sortKey) {
        if (sortDir === "desc") sort[sortKey] = -1;
        else sort[sortKey] = 1;
    }

    let totalCount = await SubTopicModel.find({
        name: new RegExp(search, "i")
    }).count();

    let data = await SubTopicModel.find({
        name: new RegExp(search, "i")
    }).populate({
        path: "topic",
        select: { _id: 1, name: 1, slug: 1 },
        populate: {
            path: "module",
            select: { _id: 1, name: 1, slug: 1 },
            populate: {
                path: "subject",
                select: { _id: 1, name: 1, slug: 1 },
                populate: {
                    path: "year",
                    select: { _id: 1, name: 1, slug: 1 },
                    sort: sort
                },
                options: {
                    sort: sort
                }
            },
            options: {
                sort: sort
            } 
        },
        options: {
            sort: sort
        }
    }).sort(sort)
    .skip((page - 1) * length)
    .limit(length);

    res.json({
        data,
        totalCount
    })
}

const create = async (req, res) => {
    try {
        let subTopic = req.body;
        subTopic.slug = slugify(subTopic.name);
        let topic = await TopicModel.findById(subTopic.topic).populate({
            path: "module",
            select: { name: true },
            populate: {
                path: "subject",
                select: { name: true },
                populate: {
                    path: "year",
                    select: { name: true }
                }
            }
        });
        subTopic.meta = {
            title: `${topic.module.subject.name}/${topic.module.name}/${topic.name}/${subTopic.name}`,
            author: "AnswerSheet Pty Ltd",
            keywords: `${topic.module.subject.name}, ${topic.module.name}, ${topic.name}, ${subTopic.name}, HSC notes, HSC study guide, syllabus summaries, dot point notes`,
            description: `${topic.module.subject.name} ${topic.module.name} ${topic.name} ${subTopic.name}`,
            summary: "HSC study guide",
            viewport: "width=device-Width, initial",
            other: ""
        }
        let result = await SubTopicModel.create(subTopic);
        topic = await TopicModel.findById(subTopic.topic);
        topic.subTopics.push(result);
        await topic.save();
    
        res.json({
            success: true,
            msg: "Successfully created."
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const fetchById = async (req, res) => {
    try {
        let { id } = req.params;
        let subTopic = await SubTopicModel.findById(id).populate({
            path: "topic",
            select: { _id: 1, name: 1 },
            populate: {
                path: "module",
                select: { _id: 1, name: 1 },
                populate: {
                    path: "subject",
                    select: { _id: 1, name: 1 },
                    populate: {
                        path: "year",
                        select: { _id: 1, name: 1 }
                    }
                }
            }
        });
        res.json({
            success: true,
            data: subTopic
        })
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const update = async (req, res) => {
    try {
        let { id } = req.params;
        let subTopic = req.body;
        let result = await SubTopicModel.findById(id);

        let topic = await TopicModel.findById(result.topic);
        topic.subTopics.pull(id);
        await topic.save();

        result = await result.update(subTopic);

        topic = await TopicModel.findById(subTopic.topic);
        topic.subTopics.push(id);
        await topic.save();

        res.json({
            success: true,
            data: result,
            msg: "Successfully updated."
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const remove = async (req, res) => {
    const { id } = req.params;
    const subTopic = await SubTopicModel.findByIdAndDelete(id);
    const topic = await TopicModel.findById(subTopic.topic);
    topic.subTopics.pull(id);
    await topic.save();
    res.json({
        success: true
    });
}

module.exports = {
    fetch,
    create,
    fetchById,
    update,
    remove
}