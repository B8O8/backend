const express = require("express");
const app = express();
const DB = require("./database").connectDB;

// routes
const authRoutes = require("./routes/authRoutes");
// connect to data base
DB();

app.use(express.json());
app.use("",authRoutes);
app.listen(process.env.PORT, ()=>{
    console.log(`Listening on port: ${process.env.PORT}`);
});

