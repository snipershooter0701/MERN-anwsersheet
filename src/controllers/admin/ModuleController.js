const SubjectModel = require("../../models/SubjectModel");
const ModuleModel = require("../../models/ModuleModel");
const TopicModel = require("../../models/TopicModel");
const SubTopicModel = require("../../models/SubTopicModel");

const { slugify } = require("../../services/helper");

const fetch = async (req, res) => {
    let { search, length, page, sortKey, sortDir } = req.body;
    let sort = {}
    if (sortKey) {
        if (sortDir === "desc") sort[sortKey] = -1;
        else sort[sortKey] = 1;
    } 

    let totalCount = await ModuleModel.find({
        name: new RegExp(search, "i")
    }).count();

    let data = await ModuleModel.find({
        name: RegExp(search, "i")
    }).populate({
        path: "subject",
        select: { _id: 1, name: 1 },
        populate: {
            path: "year",
            select: { _id: 1, name: 1 },
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
    });
}

const create = async (req, res) => {
    try {
        let module = req.body;
        module.slug = slugify(module.name);
        let result = await ModuleModel.create(module);

        const subject = await SubjectModel.findById(result.subject);
        subject.modules.push(result);
        await subject.save();

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
        let module = await ModuleModel.findById(id).populate({
            path: "subject",
            select: { _id: 1, name: 1},
            populate: {
                path: "year",
                select: { _id: 1, name: 1 }
            }
        });
        res.json({
            status: true,
            data: module
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
        let module  = req.body;
        let result = await ModuleModel.findById(id);

        let subject = await SubjectModel.findById(result.subject);
        subject.modules.pull(id);
        await subject.save();

        result = await result.update(module);

        subject = await SubjectModel.findById(module.subject);
        subject.modules.push(id);
        await subject.save();

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
        let topics = await TopicModel.find({ module: id });
        let topicIds = topics.map(topic => topic._id);
        let module = await ModuleModel.findByIdAndDelete(id);
        let subject = await SubjectModel.findById(module.subject);
        subject.modules.pull(id);
        await subject.save();
        await TopicModel.deleteMany({ module: id });
        await SubTopicModel.deleteMany({ topic: { $in: topicIds} });
        res.json({
            status: true,
            data: module,
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