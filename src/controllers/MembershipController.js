const MembershipHistory = require("../models/MembershipHistoryModel");
const MembershipModel = require("../models/MembershipModel");
const PricingModel = require("../models/PricingModel");
const InvoiceModel = require("../models/InvoiceModel");
const mongoose = require('mongoose');

const fetch = async (req, res) => {
    try {
        let memberships = await MembershipModel.find();
        let data = [], i = 0;
        for (membership of memberships) {
            let items = await PricingModel.find({ period: membership.period });
            data[i] = {
                _id: membership._id,
                name: membership.name,
                slug: membership.slug,
                label: membership.label,
                description: membership.description,
                period: membership.period,
                items: items
            }
            i++;
        }
        res.json({
            success: true,
            memberships: data
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
        let membership = await MembershipModel.findOne({ slug: id });
        res.json({
            success: true,
            membership: membership
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const getPrice = async (req, res) => {
    let { period, subject_nums } = req.query;
    let pricing = await PricingModel.findOne({ period: period, subject_nums: subject_nums });
    res.json(pricing);
}

const getPurchasedMemberships = async (req, res) => {
    let memberships = await MembershipHistory.find({
        user: req.user.userId,
        isPaid: true,
        // $or: [{
        //     expiredDate: {
        //         $gte: new Date().toISOString()
        //     }
        // }, {
        //     period: -1
        // }]
    }).populate([{
        path: 'subjects',
        populate: {
            path: 'year'
        }
    }, {
        path: "invoice"
    }]);
    res.json(memberships);
}

const getInvoices = async (req, res) => {
    let invoices = await InvoiceModel.find({
        user: req.user.userId,
    });
    res.json(invoices);
}

const checkPurchasedMembership = async (req, res) => {
    let { user, subject } = req.query;
    let membership = await MembershipHistory.find({
        user: user,
        subjects: { $in: [subject] },
        isPaid: true,
        $or: [{
            expiredDate: {
                $gte: new Date().toISOString()
            }
        }, {
            period: -1

        }]
    }).populate("invoice");
    res.json(membership);
}

const create = async (req, res) => {
    try {
        let subjects = req.body.selectedSubjects;
        let invoice = req.body.selectedInvoice;
        let membershipId = req.body.selectedMembership;
        let membership = await MembershipModel.findById(membershipId);
        invoice = await InvoiceModel.findByIdAndUpdate(invoice, { status: true });
        await MembershipHistory.create({
            user: req.params.id,
            name: membership.name,
            membership_id: membership._id,
            invoice: invoice._id,
            subjects: subjects.map((subject, idx) => subject._id),
            period: membership.period,
            price: 0,
            isPaid: true
        });
        let memberships = await MembershipHistory.find({
            user: req.params.id,
            isPaid: true
        }).populate([{
            path: 'subjects',
            populate: {
                path: 'year'
            }
        }, {
            path: "invoice"
        }]);
        res.json({
            success: true,
            data: memberships,
            msg: 'Created successfully.'
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const update = async (req, res) => {
    try {
        let membershipHistoryId = req.body.editMembershipId;
        let subjects = req.body.selectedSubjects;
        let invoice = req.body.selectedInvoice;
        let membershipId = req.body.selectedMembership;
        let currentInvoice = req.body.currentInvoice;
        let membership = await MembershipModel.findById(membershipId);
        await InvoiceModel.findByIdAndUpdate(currentInvoice, { status: false });
        invoice = await InvoiceModel.findByIdAndUpdate(invoice, { status: true });
        await MembershipHistory.findByIdAndUpdate(membershipHistoryId, {
            name: membership.name,
            membership_id: membership._id.toString(),
            invoice: invoice,
            subjects: subjects.map((subject, idx) => subject._id),
            period: membership.period,
        });
        let memberships = await MembershipHistory.find({
            user: req.params.id,
            isPaid: true
        }).populate([{
            path: 'subjects',
            populate: {
                path: 'year'
            }
        }, {
            path: "invoice"
        }]);
        res.json({
            success: true,
            data: memberships,
            msg: 'Updated successfully.'
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const deleteMembershipHistory = async (req, res) => {
    try {
        let { membershipId, id } = req.params;
        let membershipToDelete = await MembershipHistory.findById(membershipId);
        let invoiceId = membershipToDelete.invoice.toString();
        await InvoiceModel.findByIdAndUpdate(invoiceId, { status: false });
        await MembershipHistory.findByIdAndDelete(membershipId);
        // let user = await UserModel.findById(id);
        // let invoices = await InvoiceModel.find({ user: id });
        let memberships = await MembershipHistory.find({
            user: id,
            isPaid: true
        }).populate([{
            path: 'subjects',
            populate: {
                path: 'year'
            }
        }, {
            path: "invoice"
        }]);
        res.json({
            success: true,
            memberships,
            msg: 'Deleted successfully.'
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        })
    }
}

module.exports = {
    fetch,
    fetchById,
    getPrice,
    getPurchasedMemberships,
    checkPurchasedMembership,
    getInvoices,
    create,
    update,
    deleteMembershipHistory
}