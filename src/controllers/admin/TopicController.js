const ModuleModel = require("../../models/ModuleModel");
const TopicModel = require("../../models/TopicModel");
const SubTopicModel = require("../../models/SubTopicModel");
const { slugify } = require("../../services/helper");

const fetch = async (req, res) => {
    let { search, length, page, sortKey, sortDir } = req.query
    let sort = {};
    if (sortKey) {
        if (sortDir === "desc") sort[sortKey] = -1;
        else sort[sortKey] = 1;
    }

    let totalCount = await TopicModel.find({
        name: new RegExp(search, "i")
    }).count();
    
    let data = await TopicModel.find({
        name: new RegExp(search, "i")
    })
    .populate({
        path: "module",
        select: { _id: 1, name: 1 },
        populate: {
            path: "subject",
            select: { _id: 1, name: 1 },
            options: {
                sort: sort
            },
            populate: {
                path: "year",
                select: { _id: 1, name: 1 },
                options: {
                    sort: sort
                }
            }
        },
        options: {
            sort: sort
        }
    })
    .sort(sort)
    .skip((page - 1) * length)
    .limit(length);
    res.json({
        data,
        totalCount
    });
}

const create = async (req, res) => {
    try {
        let topic = req.body;
        topic.slug = slugify(topic.name);
        let result = await TopicModel.create(topic);

        const module = await ModuleModel.findById(result.module);
        module.topics.push(result);
        await module.save();

        res.json({
            status: true,
            msg: "Successfully created.",
            data: result
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }
}

const fetchById = async (req, res) => {
    try {
        let { id } = req.params;
        let topic = await TopicModel.findById(id).populate({
            path: "module",
            select: { _id: 1, name: 1},
            populate: {
                path: "subject",
                select: { _id: 1, name: 1 },
                populate: {
                    path: "year",
                    select: { _id: 1, name: 1}
                }
            }
        });
        res.json({
            status: true,
            data: topic
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }

}

const update = async (req, res) => {
    try {
        let { id } = req.params;
        let topic  = req.body;
        let result = await TopicModel.findById(id);

        let module = await ModuleModel.findById(result.module);
        module.topics.pull(id);
        await module.save();

        result = await result.update(topic);

        module = await ModuleModel.findById(topic.module);
        module.topics.push(id);
        await module.save();
        
        res.json({
            status: true,
            data: result,
            msg: "Successfully updated."
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }
}

const remove = async (req, res) => {
    try {
        let { id } = req.params;
        let topic = await TopicModel.findByIdAndDelete(id);
        
        let module = await ModuleModel.findById(topic.module);
        module.topics.pull(id);
        await module.save();

        await SubTopicModel.deleteMany({ topic: id })
        res.json({
            status: true,
            data: topic,
            msg: "Successfully deleted!"
        });
    } catch (err) {
        res.json({
            status: false,
            msg: err.message
        });
    }
}

module.exports = {
    fetch,
    create,
    fetchById,
    update,
    remove
}