const express = require('express');
const cors = require("cors");
const bodyParser = require("body-parser");
const { MongoClient } = require('mongodb');
const ObjectId = require("mongodb").ObjectId;
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extented: true }));



// --------------------------------------
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2vlh5.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// console.log(uri);

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const carsCollection = client.db("carHub").collection("cars");
        const usersCollection = client.db("carHub").collection("users");
        const orderCollection = client.db("carHub").collection("bookings");
        const reviewCollection = client.db("carHub").collection("reviews");

        // Add Services
        app.post('/addServices', async (req, res) => {
            const newService = req.body;
            const result = await carsCollection.insertOne(newService);
            console.log('got new service', newService);
            console.log('added service', result);
            res.json(result);
        });
        app.post('/addBooking', async (req, res) => {
            const newOrder = req.body;
            const result = await orderCollection.insertOne(newOrder);
            console.log('got new order', newOrder);
            console.log('added order', result);
            res.json(result);
        });
        app.post('/reviews', async (req, res) => {
            const newReview = req.body;
            const result = await reviewCollection.insertOne(newReview);
            res.json(result);
        });
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            console.log('got new user', user);
            console.log('added user', result);
            res.json(result);
        });
        // upsert user
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const options = { upsert: true };
            const updateDoc = { $set: user };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.json(result);
        })
        // make admin
        app.put('/users/admin', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = { $set: { role: 'admin' } };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.json(result);
        })

        // Get Services
        app.get('/cars', async (req, res) => {
            const cursor = carsCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/reviews', async (req, res) => {
            const cursor = reviewCollection.find({});
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/orders', async (req, res) => {
            const cursor = orderCollection.find({});
            const orders = await cursor.toArray();
            res.send(orders);
        });

        app.get('/cars/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const user = await carsCollection.findOne(query);
            res.send(user);
        })
        app.get('/orders/:email', async (req, res) => {

            const result = await orderCollection.find({ email: req.params.email }).toArray();
            res.send(result);
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })
        // Cancel Orders
        app.delete('/deleteOrder/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);

            console.log('deleting user with id ', result);

            res.json(result);
        })
        // Approve Order
        app.put('/approveOrder/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: "Shipped"
                },
            };
            const result = await orderCollection.updateOne(filter, updateDoc, options)
            console.log('updating', id)
            res.json(result)
        })
    } finally {
        // await client.close();
    }
}
run().catch(console.dir);


// ---------------------------------------

app.get('/', (req, res) => {
    res.send('Car-hub server is running');
});

app.listen(port, () => {
    console.log('Server running at port', port);
})