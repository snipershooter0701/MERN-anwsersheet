const path = require("path");
const fs = require("fs");
const YearModel = require("../../models/YearModel");
const SubjectModel = require("../../models/SubjectModel");
const ModuleModel = require("../../models/ModuleModel");
const TopicModel = require("../../models/TopicModel");
const SubTopicModel = require("../../models/SubTopicModel");
const { getMainUrl, slugify } = require("../../services/helper");

const fetch = async (req, res) => {
    let { search, length, page, sortKey, sortDir } = req.query;
    let sort = {};
    if (sortKey) {
        if (sortDir === "desc") sort[sortKey] = -1;
        else sort[sortKey] = 1;
    }
    let totalCount = await YearModel.find({
        name: new RegExp(search, "i")
    }).count();

    let data = await YearModel.find({
        name: new RegExp(search, "i")
    }).sort(sort).skip((page - 1) * length).limit(length);

    res.json({
        data,
        totalCount
    });
}

const fetchAll = async (req, res) => {
    let years = await YearModel.find();
    res.json(years);
}

const fetchAllPopulate = async (req, res) => {
    let years = await YearModel.find().select({ _id: 1, name: 1 }).populate({
        path: "subjects",
        select: { _id: 1, name: 1 },
        populate: {
            path: "modules",
            select: { _id: 1, name: 1 },
            populate: {
                path: "topics",
                select: { _id: 1, name: 1 }
            }
        }
    });
    return res.json(years);
}

const create = async (req, res) => {
    try {
        let year = req.body;
        if (req.file) {
            year.image = getMainUrl(req) + `/uploads/years/${req.file.filename}`;
        } else {
            year.image = null;
        }
        year.slug = slugify(year.name);
        let result = await YearModel.create(year);
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

const update = async (req, res) => {
    try {
        let year = req.body;
        let { id } = req.params;
        let currentYear = await YearModel.findById(id);
        if (req.file) {
            year.image = getMainUrl(req) + `/uploads/years/${req.file.filename}`;
            if (currentYear.image) {
                let fileName = path.basename(currentYear.image);
                if (fileName && fs.existsSync(`public/uploads/years/${fileName}`)) fs.unlinkSync(`public/uploads/years/${fileName}`);
            }
        }
        let result = await YearModel.findByIdAndUpdate(id, year);
        res.json({
            status: true,
            msg: "Successfully updated.",
            data: result
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
        let subjects = await SubjectModel.find({ year: id }).select({ _id: true, icon: true });
        let subjectIds = subjects.map(subject => subject._id);
        let modules = await ModuleModel.find({ subject: { $in: subjectIds } }).select({ _id: true });
        let moduleIds = modules.map(module => module._id);
        let topics = await TopicModel.find({ module: { $in: moduleIds } }).select({ _id: true });
        let topicIds = topics.map(topic => topic._id);

        let year = await YearModel.findByIdAndDelete(id);
        if (year.image) {
            let fileName = path.basename(year.image);
            if (fileName) fs.unlinkSync(`public/uploads/years/${fileName}`);
        }

        await SubjectModel.deleteMany({ year: id });
        for (let subject of subjects) {
            if (subject.icon) {
                let fileName = path.basename(subject.icon);
                if (fileName) fs.unlinkSync(`public/uploads/subjects/${fileName}`);
            }
        }
        await ModuleModel.deleteMany({ subject: { $in: subjectIds } });
        await TopicModel.deleteMany({ module: { $in: moduleIds } });
        await SubTopicModel.deleteMany({ topic: { $in: topicIds } });
        
        res.json({
            status: true,
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
    fetchAll,
    fetchAllPopulate,
    create,
    update,
    remove
}