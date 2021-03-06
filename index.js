const express = require('express')
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const jwt = require('jsonwebtoken');
const sign = require('jsonwebtoken/sign');
require('dotenv').config()
const port = process.env.PORT || 5000;


// middel ware 
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.slhbj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


//verifyJWT token access data

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorization access' })
  }
  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' })
    }
    req.decoded = decoded;
    next()
  })

}


async function run() {
  try {
    await client.connect();
    const toolsCollection = client.db("manufacture_tools").collection("tools");
    const purchaseCollection = client.db("manufacture_tools").collection("purchases");
    const userCollection = client.db("manufacture_tools").collection("users");
    const reviewCollection = client.db("manufacture_tools").collection("reviews");


    // get all tools load database  api
    app.get('/tools', async (req, res) => {
      const query = {};
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    })

    // get on tool load database  api 
    app.get('/tools/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const tool = await toolsCollection.findOne(query);
      res.send(tool);
    })


    // product add tools collections
    app.post('/product', verifyJWT,  async (req, res) => {
      const product = req.body;
      const result = await toolsCollection.insertOne(product);
      res.send(result);

    })

    app.delete('/product/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await toolsCollection.deleteOne(query);
      res.send(result);
    })


    // crate token by login create account 
    app.put('/user/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = sign({ email: email }, process.env.ACCESS_TOKEN, { expiresIn: '1d' });

      res.send({ result, token })

    })


    // all user load an api
    app.get('/users', verifyJWT, async (req, res) => {
      const user = await userCollection.find().toArray();
      res.send(user);
    })


    // review all load 
    app.get('/review',  async (req, res) => {
      const review = await reviewCollection.find().toArray();
      res.send(review);
    })


    // post review api 
    app.post('/review', verifyJWT,  async (req, res) => {
      const review = req.body;
      console.log(review)
      const result = await reviewCollection.insertOne(review);
      res.send(result)
    })


    // chake this admin 
    app.get('/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email })
      const isAdmin = user.role === 'admin';
      res.send({ admin: isAdmin })
      // res.send({admin:isAdmin})
    })


    app.put('/user/admin/:email', verifyJWT, async (req, res) => {

      const email = req.params.email;
      const requester = req.decoded.email;
      console.log(requester);
      const requesterAccount = await userCollection.findOne({ email: requester });
      // console.log(email) ; 
      console.log(requesterAccount)
      if (requesterAccount.role === 'admin') {
        const filter = { email: email };
        const updateDoc = {
          $set: { role: 'admin' },
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result)
      }
      else {
        res.status(403).send({ message: 'Forbidden' });
      }

    })



    // all purchase post is api 
    app.post('/purchase',  async (req, res) => {
      const purchase = req.body;
      const result = await purchaseCollection.insertOne(purchase);
      res.send(result)
    })


    // all load purchase api
    app.get('/purchases', verifyJWT, async (req, res) => {
      const purchase = await purchaseCollection.find().toArray();
      res.send(purchase)
    })


    // admin order sate change 
    app.put('/purchase/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) }
      const updateDoc = {
        $set: { position: 'deliver' },
      };
      const result = await purchaseCollection.updateOne(filter, updateDoc);
      res.send(result)
    }
    )


    // user purchase by on user get on api  email 
    app.get('/purchase/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const orders = await purchaseCollection.find(query).toArray();
      res.send(orders);
    })


    // delete purchase api 
    app.delete('/purchase/:id', verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await purchaseCollection.deleteOne(query);
      res.send(result);
    })


  }
  finally {
    // await client.close()
  }
}



run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Manufacturer Tools')
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})