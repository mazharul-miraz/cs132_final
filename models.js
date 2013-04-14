/**
 * Example file for how to define our models.
 * Check out http://www.sequelizejs.com/ for more advanced
 * functionality
 */

var Sequelize = require("sequelize");

var sequelize = new Sequelize('database', null, null,
    {
        // the sql dialect of the database
        dialect: 'sqlite',
        // the storage engine for sqlite - default ':memory:'
        storage: './temp.db'
    });

var Location = sequelize.define('Location',
    {
        id: { type: Sequelize.INTEGER, autoIncrement: true },
        longitude: Sequelize.FLOAT,
        latitude: Sequelize.FLOAT
    }
);

var FeedFire = sequelize.define('FeedFire',
    {
        id: { type: Sequelize.INTEGER, autoIncrement: true },
        feed: Sequelize.BOOLEAN
    },
    {
        timestamps: false
    }).belongsTo(Location);


var Volume = sequelize.define('Volume',
    {
        id: { type: Sequelize.INTEGER, autoIncrement: true },
        dir: Sequelize.INTEGER
    },
    {
        timestamps: false
    }).belongsTo(Location);

sequelize.sync({force: true});
exports.Location = Location;
exports.FeedFire = FeedFire;
exports.Volume = Volume;