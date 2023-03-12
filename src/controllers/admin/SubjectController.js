const YearModel = require("../../models/YearModel");
const SubjectModel = require("../../models/SubjectModel");
const ModuleModel = require("../../models/ModuleModel");
const TopicModel = require("../../models/TopicModel");
const SubTopicModel = require("../../models/SubTopicModel");
const { getMainUrl, slugify } = require("../../services/helper");
const path = require("path");
const fs = require('fs');

const fetch = async (req, res) => {
    let { search, length, page, sortKey, sortDir } = req.query
    let sort = {};
    if (sortKey) {
        if (sortDir === "desc") sort[sortKey] = -1;
        else sort[sortKey] = 1;
    }
    
    let totalCount = await SubjectModel.find({
        name: new RegExp(search, "i")
    }).count();
    let data = await SubjectModel.find({
        name: new RegExp(search, "i")
    }).populate({
        path: "year",
        options: {
            sort: sort
        }
    }).sort(sort).skip((page - 1) * length).limit(length);

    res.json({
        data,
        totalCount
    });
}

const create = async (req, res) => {
    try {
        let subject = req.body;
        if (req.file) {
            subject.icon = getMainUrl(req) + `/uploads/subjects/${req.file.filename}`;        
        } else {
            subject.icon = null;
        }
        subject.slug = slugify(subject.name);
        let result = await SubjectModel.create(subject);
        const year = await YearModel.findById(subject.year);
        year.subjects.push(result);
        await year.save();
        res.json({
            status: true,
            data: result,
            msg: "Successfully created."
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
        let subject = await SubjectModel.findById(id);
        res.json({
            status: true,
            data: subject
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
        let subject = req.body;
        let result = await SubjectModel.findById(id);
        if (req.file) {
            subject.icon = getMainUrl(req) + `/uploads/subjects/${req.file.filename}`;        
            if (result.icon) {
                let fileName = path.basename(result.icon);
                if (fileName && fs.existsSync(`public/uploads/subjects/${fileName}`)) fs.unlinkSync(`public/uploads/subjects/${fileName}`);
            }
        }
        
        let year = await YearModel.findById(result.year);
        year.subjects.pull(id);
        await year.save();

        result = await result.update(subject);
        
        year = await YearModel.findById(subject.year);
        year.subjects.push(id);
        await year.save();

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
        let modules = await ModuleModel.find({ subject: id }).select({ _id: true });
        let moduleIds = modules.map(module => module._id);
        let topics = await TopicModel.find({ modules: { $in: moduleIds }}).select({ _id: true });
        let topicIds = topics.map(topic => topic._id);

        let subject = await SubjectModel.findByIdAndDelete(id);
        if (subject.icon) {
            let fileName = path.basename(subject.icon);
            if (fileName) fs.unlinkSync(`public/uploads/subjects/${fileName}`);
        }
        
        let year = await YearModel.findById(subject.year);
        year.subjects.pull(id);
        await year.save();
        
        await ModuleModel.deleteMany({ subject: id });
        await TopicModel.deleteMany({ module: { $in: moduleIds }});
        await SubTopicModel.deleteMany({ topic: { $in: topicIds }});

        res.json({
            status: true,
            data: subject,
            msg: "Successfully deleted."
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