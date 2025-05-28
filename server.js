const mongoose = require('mongoose');
const express = require('express')
require('dotenv').config();
const userRoute=require("./routes/userRoute");
const productRoute = require("./routes/productRoute")
const orderRoute = require("./routes/orderRoute")

const app = express();

//appel au middlewares 
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// définition des routes
app.use('/api/users', userRoute);
app.use('/api/products', productRoute);
app.use('/api/orders', orderRoute);

// app.use(('/api/products', productsRoute);

// connection à la base de données
mongoose.connect(process.env.MONGODB_URL, {
    dbName: process.env.DB_NAME
  })
  .then(res => console.log("connected to DB ..."))
  .catch((error) => console.log(error));

// app c'est notre API node.js qui écoute sur le port 5000 (défini dans .env)
// on utilise le package env pour récupérer les variables d'environement avec process.env

app.listen(process.env.PORT, () => {
    console.log(`Server started at http://localhost:${process.env.PORT}`);
});

