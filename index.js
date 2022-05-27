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
async function run(){
  try{
    await client.connect();
    const toolsCollection = client.db("manufacture_tools").collection("tools") ;
    const purchaseCollection = client.db("manufacture_tools").collection("purchases") ;
    const userCollection = client.db("manufacture_tools").collection("users") ;

    // get all tools load database  api
    app.get('/tools', async(req, res) => {
      const query = {} ;
      const result = await toolsCollection.find(query).toArray();
      res.send(result);
    })
    // get on tool load database  api 
    app.get('/tools/:id', async(req, res) => {
      const id = req.params.id ;
      const query = {_id : ObjectId(id)} ;
      const tool = await toolsCollection.findOne(query) ;
      res.send(tool);
    })

    //
    app.put('/user/:email', async(req, res) => {
      const email = req.params.email ;
      const user = req.body ;
      const filter = {email: email}  ;
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options) ;
      const token = sign({email: email}, process.env.ACCESS_TOKEN, { expiresIn: '1d' });

      res.send({result, token})
      
    })

    // all purchase post is api 
    app.post('/purchase', async(req, res) => {
      const purchase = req.body ;
      const result = await purchaseCollection.insertOne(purchase) ;
      res.send(result)
    })

    
  }
  finally{
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