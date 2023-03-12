const express = require('express');
const path = require("path");
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const middlewares = require('./middlewares');
const apiRoutes = require('./routes/api');
const { dbConnect, seedUser, seedMembership } = require('./services/db');
const app = express();

app.use(express.static(path.join(__dirname, "/../public")));
app.use(morgan('dev'));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

dbConnect('mongodb://localhost:27017');
seedUser();
seedMembership();
app.use('/api/v1', apiRoutes);

app.all('*', function(req, res) {
    res.sendFile(path.join(__dirname, "/../public/index.html"));
});
app.use(middlewares.notFound);
app.use(middlewares.errorHandler);


module.exports = app;
