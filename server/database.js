const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

exports.connectDB = async() => {
    try {
        await mongoose.connect(process.env.DB_URL);
        console.log("connected to databse");

    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}