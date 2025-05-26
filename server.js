const mongoose = require('mongoose');
const express = require('express')
require('dotenv').config();
const userRoute=require("./routes/userRoute");


const app = express();

//appel au middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoute);


mongoose.connect(process.env.MONGODB_URL, {
    dbName: process.env.DB_NAME
  })
  .then(res => console.log("connected to DB ..."))
  .catch((error) => console.log(error));


app.listen(process.env.PORT, () => {
    console.log(`Server started at http://localhost:${process.env.PORT}`);
});

