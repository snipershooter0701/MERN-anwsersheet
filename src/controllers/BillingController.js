const uniqid = require("uniqid");
const TransactionModel = require("../models/TransactionModel");
const InvoiceModel = require("../models/InvoiceModel");
const UserModel = require("../models/UserModel");
const MembershipHistoryModel = require("../models/MembershipHistoryModel");
const moment = require("moment");
const paypal = require("paypal-rest-sdk");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const sgMail = require("@sendgrid/mail");
paypal.configure({
    mode: 'sandbox',
    client_id: process.env.PAYPAL_CLIENT_ID,
    client_secret: process.env.PAYPAL_CLIENT_SECRET
});
sgMail.setApiKey(process.env.SENDGRID_API_KEY)


const purchase = async (req, res) => {
    try {
        let { gateway } = req.params;
        let { user, membership } = req.body;
        let membershipHistory = await MembershipHistoryModel.create({
            user: user._id.toString(),
            name: membership.name,
            subjects: membership.subjects.map((subject => subject._id)),
            period: membership.period,
            price: membership.price
        });
        if (gateway === "paypal") {
            paypal.payment.create({
                intent: "sale",
                payer: {
                    payment_method: "paypal"
                },
                redirect_urls: {
                    return_url: `${process.env.HOSTNAME}/billing/paypal/return?history_id=${membershipHistory._id}`,
                    cancel_url: `${process.env.HOSTNAME}/billing/paypal/cancel`
                },
                transactions: [{
                    custom: user._id.toString(),
                    item_list: {
                        items: [{
                            name: membership.name,
                            sku: "item",
                            currency: "AUD",
                            price: (membership.price / 1.11).toFixed(2),
                            tax: ((membership.price / 1.11) * 0.11).toFixed(2),
                            quantity: 1,
                            description: membership.description
                        }]
                    },
                    amount: {
                        currency: "AUD",
                        total: membership.price,
                        details: {
                            subtotal: (membership.price / 1.11).toFixed(2),
                            tax: ((membership.price / 1.11) * 0.11).toFixed(2)
                        }
                    }
                }]
            }, function (err, payment) {
                if (err) throw err;
                else {
                    res.json({
                        success: true,
                        redirect_url: payment.links[1].href
                    });
                }
            });
        } else if (gateway === "stripe") {
            let description = `${membership.name} - ${membership.subjects.length} ${membership.subjects.length > 1 ? 'subjects' : 'subject'}`;
            membership.subjects.forEach((subject, idx) => {
                description += `${subject.year_name} - ${subject.name}`;
            });
            const taxRate = await stripe.taxRates.create({
                display_name: 'GST',
                description: 'Goods & Service Tax',
                jurisdiction: 'AU',
                percentage: 11,
                inclusive: false,
            });
            let payment = await stripe.checkout.sessions.create({
                mode: 'payment',
                client_reference_id: user._id.toString(),
                payment_method_types: ['card'],
                customer_email: user.email,
                line_items: [{
                    price_data: {
                        currency: 'AUD',
                        product_data: {
                            name: membership.name,
                            description: description,
                            images: ["https://answersheet.au/logo.svg"]
                        },
                        unit_amount: (membership.price / 1.11).toFixed(2) * 100
                    },
                    tax_rates: [taxRate.id],
                    quantity: 1
                }],
                success_url: `${process.env.HOSTNAME}/billing/stripe/return?session_id={CHECKOUT_SESSION_ID}&history_id=${membershipHistory._id}`,
                cancel_url: `${process.env.HOSTNAME}/current-membership`
            });
            return res.json({
                success: true,
                redirect_url: payment.url
            });
        }
    } catch (err) {
        return res.json({
            success: false,
            msg: err.message
        });
    }
}

const gatewayReturn = async (req, res) => {
    try {
        let { paymentId, payerId, historyId } = req.query;
        let { gateway } = req.params;

        if (gateway === "paypal") {
            paypal.payment.execute(paymentId, {
                payer_id: payerId,
            }, async function (err, payment) {
                await TransactionModel.create({
                    user: payment.transactions[0].custom,
                    transaction_id: payment.transactions[0].related_resources[0].sale.id,
                    amount: payment.transactions[0].amount.total,
                    currency: payment.transactions[0].amount.currency,
                    note: "membership",
                    type: "paypal"
                });
                let user = await UserModel.findById(payment.transactions[0].custom);
                let lastInvoice = await InvoiceModel.findOne().sort({ invoice_id: -1 });
                let invoice = await InvoiceModel.create({
                    user: payment.transactions[0].custom,
                    invoice_id: lastInvoice ? lastInvoice.invoice_id + 1 : 11231,
                    item_name: payment.transactions[0].item_list.items[0].name,
                    item_description: payment.transactions[0].item_list.items[0].description,
                    amount: payment.transactions[0].amount.total,
                    gst: payment.transactions[0].item_list.items[0].tax,
                    currency: payment.transactions[0].item_list.items[0].currency,
                    paid_date: moment(payment.create_time).format("YYYY-MM-DD HH:mm:ss")
                });

                let history = await MembershipHistoryModel.findById(historyId);
                let expiredDate = moment().add(history.period, "M").format("YYYY-MM-DD HH:mm:ss");
                if (Number(history.period) !== -1) {
                    await history.update({
                        isPaid: true,
                        invoice: invoice._id,
                        expiredDate: expiredDate
                    });
                } else {
                    await history.update({ invoice: invoice._id, isPaid: true });
                }

                res.json({
                    success: true,
                    email: user.email,
                    invoiceId: invoice.id,
                    msg: "Successfully purchased. Right now you need to verify email. Please check your email."
                });
            });
        } else if (gateway === "stripe") {
            let payment = await stripe.checkout.sessions.retrieve(paymentId);
            let lineItems = await stripe.checkout.sessions.listLineItems(paymentId, { limit: 1 });
            let transaction = await stripe.paymentIntents.retrieve(payment.payment_intent);
            await TransactionModel.create({
                user: payment.client_reference_id,
                transaction_id: transaction.id,
                amount: transaction.amount / 100,
                currency: payment.currency.toUpperCase(),
                type: "stripe",
                note: "membership"
            });
            let user = await UserModel.findById(payment.client_reference_id);
            let lastInvoice = await InvoiceModel.findOne().sort({ invoice_id: -1 });
            let invoice = await InvoiceModel.create({
                user: payment.client_reference_id,
                invoice_id: lastInvoice ? lastInvoice.invoice_id + 1 : 11231,
                item_name: lineItems.data[0].description,
                item_description: lineItems.data[0].description + " Description.",
                amount: lineItems.data[0].amount_total / 100,
                gst: lineItems.data[0].amount_tax / 100,
                currency: lineItems.data[0].currency,
                paid_date: moment.unix(payment.created).format("YYYY-MM-DD HH:mm:ss")
            });
            let history = await MembershipHistoryModel.findById(historyId);
            let expiredDate = moment().add(history.period, "M").format("YYYY-MM-DD HH:mm:ss");
            if (Number(history.period) !== -1) {
                await history.update({
                    isPaid: true,
                    invoice: invoice._id,
                    expiredDate: expiredDate
                });
            } else {
                await history.update({ isPaid: true, invoice: invoice._id });
            }

            res.json({
                success: true,
                email: user.email,
                invoiceId: invoice.id,
                msg: "Successfully purchased. Right now you need to verify email. Please check your email."
            });
        }
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const invoice = async (req, res) => {
    try {
        let { email, invoiceId } = req.body;
        let invoice = await InvoiceModel.findById(invoiceId);
        await sgMail.send({
            to: email,
            from: {
                email: process.env.SENDGRID_USER,
                name: process.env.SENDGRID_NAME
            },
            subject: "Congratulations for purchasing our memberships.",
            html: `
            <div style="background: #fafafa; font-family: sans-serif; max-width: 660px; margin: auto">
                <div style="padding: 10px; margin-bottom: 20px; background: #d6e4f1">
                    <img src="${process.env.HOSTNAME}/logo.svg" />
                </div>
                <div style="padding: 10px 20px; border-top: 2px solid #ebebeb; border-bottom: 2px solid #ebebeb;">
                    <h2 style="color: #005492">Congratulations for purchasing our memberships.</h2>
                    <div style="max-width: 1000px">
                        <div style="word-wrap:break-word;border:1px solid rgba(0,0,0,0.175);border-radius:0.375rem;margin-bottom:1rem">
                            <div style="padding:1.5rem;width:100%">
                                <h3 style="color:#005492;margin-top:0;">Tax Invoice</h3>
                                <div style="display:block;overflow:auto">
                                    <div style="display:block;margin-right:auto;max-width:350px;float:left">
                                        <h4 style="color:#333333;margin-top:0; margin-bottom: .5rem;">To</h4>
                                        <h4 style="color:#005492;margin-top:0;margin-bottom:.5rem;">${invoice.item_name}</h4>
                                        <div style="display:flex">
                                            <div style="margin-right:25px">
                                                <div style="color:#505050;font-size:12px;line-height:1.5">Invoice Number</div>
                                                <div style="color:#333333;font-size:16px;line-height:1.5;font-weight:600">${invoice.invoice_id}</div>
                                            </div>
                                            <div>
                                                <div style="color:#505050;font-size:12px;line-height:1.5">Paid Date</div>
                                                <div style="color:#333333;font-size:16px;line-height:1.5;font-weight:600">${moment(invoice.paid_date).format("DD MMM YYYY")}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="display:block;margin-left:auto;max-width:500px;float:right">
                                        <h4 style="color:#333333;margin-top:0;margin-bottom:.5rem;">From</h5>
                                            <div style="display:flex;margin-top:0">
                                                <div style="width:100%;max-width:100%;padding-right:calc(1.5rem*.5);margin-top:0">
                                                    <h4 style="color:#005492;margin-top:0;margin-bottom:.5rem;">${invoice.company}</h4>
                                                    <p style="margin-bottom:0; font-size: 15px; line-height: 1.2;">${invoice.address}</p>
                                                </div>
                                                <div style="width:100%;max-width:100%;padding-right:calc(1.5rem*.5);margin-top:0">
                                                    <h4 style="color:#005492;margin-top:0;margin-bottom:.5rem;">All Billing Enquiries</h4>
                                                        <p style="margin-bottom:0">${invoice.email}</p>
                                                </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style="display:flex;min-width:0;word-wrap:break-word;border:1px solid rgba(0,0,0,0.175);border-radius:0.375rem; margin-bottom: 1rem;">
                            <div style="width:100%;padding:1.5rem">
                                <div style="display:block;overflow:auto;">
                                    <h3 style="margin-top: 0; float:left">Item Description</h3>
                                    <h3 style="margin-top: 0; float:right">Amount</h3>
                                </div>
                                <div style="display:block;overflow:auto;margin-bottom:1rem">
                                    <div style="float:left">
                                        <p style="margin-top:0px;font-size:15px;margin-bottom:.5rem">${invoice.item_name}</p>
                                        <p style="margin-top:0px;font-size:15px;margin-bottom:.5rem">${invoice.item_description}</p>
                                    </div>
                                    <div style="float:right;font-size:15px">$${Number(invoice.amount - invoice.gst).toFixed(2)}</div>
                                </div>
                                <div
                                    style="border-radius:5px;background-color:#d6e4f1;display:block;overflow:auto;padding:0px 20px;">
                                    <div style="float:left;display:block;max-width:300px;width:100%">
                                        <div style="overflow:auto">
                                            <h3 style="float:left; margin-bottom: 0">Sub Total</h3>
                                            <h3 style="float:right; margin-bottom: 0">$${Number(invoice.amount - invoice.gst).toFixed(2)}</h3>
                                        </div>
                                        <div style="overflow:auto">
                                            <h3 style="float:left">Total GST 10%</h3>
                                            <h3 style="float:right">${Number(invoice.gst).toFixed(2)}</h3>
                                        </div>
                                    </div>
                                    <div style="float:right;text-align:right">
                                        <h3 style="margin-bottom: 0">Amount Due Aus</h3>
                                        <h3>$${Number(invoice.amount).toFixed(2)}</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding: 10px 20px; font-size: 12px;">
                    <p>&copy; 2023 AnswerSheet Pty Ltd</p>
                    <p>Our <a href="./index.html">Privacy Policy</a> explains how we collect, use, disclose, holds and secures
                        personal information.</p>
                    <p>Please do not reply to this email.</p>
                </div>
            </div>
            `
        });
        res.json({
            success: true,
            msg: "Successfully sent. Please check your email."
        });
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

const webhook = async (req, res) => {
    try {
        let { gateway } = req.params;
        if (gateway === "paypal") {
            if (req.body.event_type === "BILLING.SUBSCRIPTION.UPDATED") {
                let { id } = req.body.resource;
                let subscription = await paypal.getSubscription(id);
                let data = await paypal.getTransactionsBySubscription(subscription);

                await TransactionModel.create({
                    user_id: subscription.custom_id,
                    transaction_id: data.transactions[0].id,
                    payer_id: subscription.subscriber.payer_id,
                    amount: data.transactions[0].amount_with_breakdown.gross_amount.value,
                    currency: data.transactions[0].amount_with_breakdown.gross_amount.currency_code,
                    type: "paypal"
                });
            } else if (req.body.event_type === "BILLING.SUBSCRIPTION.PAYMENT.FAILED") {
                let { id } = req.body.resource;
                let transaction = await TransactionModel.findOne({ subscription_id: id });
                await UserModel.findByIdAndUpdate(transaction.user_id, {
                    isPaid: false
                });
            }
        } else if (gateway === "stripe") {
            let event = req.body;
            const webhookSecret = "whsec_d32a409985da76aa0db24743e6c9205eee392d5120795a876bdd7c5e8d17289f";
            if (webhookSecret) {
                let signature = req.headers["stripe-signature"];
                try {
                    event = await stripe.webhooks.constructEvent(
                        req.body,
                        signature,
                        webhookSecret
                    );
                } catch (err) {
                    return res.sendStatus(400);
                }
            }
            let subscription;
            let status;
            let localTransaction;
            switch (event.type) {
                case "customer.subscription.created":
                    break;
                case "customer.subscription.updated":
                    subscription = event.data.object;
                    status = subscription.status;
                    let transactions = await stripe.paymentIntents.list({
                        customer: subscription.customer,
                        limit: 1
                    });
                    let transaction = transactions.data[0];
                    localTransaction = await TransactionModel.findOne({ subscription_id: subscription.id });
                    await TransactionModel.create({
                        user_id: localTransaction.user_id,
                        transaction_id: transaction.id,
                        payer_id: subscription.customer,
                        amount: transaction.amount,
                        currency: subscription.currency.toUpperCase(),
                        type: "stripe"
                    });
                    break;
                case "customer.subscription.deleted":
                    subscription = event.data.object;
                    status = subscription.status;
                    localTransaction = await TransactionModel.findOne({ subscription_id: subscription.id });
                    await UserModel.findByIdAndUpdate(localTransaction.user_id, {
                        isPaid: false
                    });
                    break;
            }
            res.sendStatus(200);
        }
    } catch (err) {
        res.json({
            success: false,
            msg: err.message
        });
    }
}

module.exports = {
    purchase,
    gatewayReturn,
    invoice,
    webhook
}