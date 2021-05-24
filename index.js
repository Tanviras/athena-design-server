const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
require('dotenv').config();


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjygh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('services'));
app.use(fileUpload())

const port = 5000;

app.get('/', function (req, res) {
    res.send('hello world')
})


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect((err) => {
    const servicesCollection = client.db("athenaDesign").collection("services");
    const reviewsCollection = client.db("athenaDesign").collection("reviews");
    const ordersCollection = client.db("athenaDesign").collection("orders");
    const adminsCollection = client.db("athenaDesign").collection("admins");
    console.log('db connection successfully');



    //Client side

    //getting the services
    app.get("/services", (req, res) => {
      servicesCollection.find({}).toArray((err, documents) => {
        res.send(documents);
      });
    });
   

    //place an order
    app.post("/addOrder", (req, res) => {


      const name = req.body.name;
      const email = req.body.email;
      const selectedService = req.body.selectedService;
      const description = req.body.description;
      const price = req.body.price;
      const file = req.files.file;

      const newImg = file.data;
      const encImg = newImg.toString("base64");
  
      var image = {
        contentType: file.mimetype,
        size: file.size,
        img: Buffer.from(encImg, "base64"),
      };


      ordersCollection.insertOne({ name,email,selectedService, description,price, image }).then((result) => {
        res.send(result.insertedCount > 0);
      });
    });





    //services ordered by a particular customer
    app.get("/servicesOrdered", (req, res) => {
      ordersCollection
        .find({ email: req.query.email })
        .toArray((err, documents) => {
          res.send(documents);
        });
    });


    



//ADMIN PANEL

    //To add a service to the server(files uploading special submit)
    app.post("/addService", (req, res) => {
        const file = req.files.file;
        const name = req.body.name;
        const description = req.body.description;
        const newImg = file.data;
        const encImg = newImg.toString("base64");
    
        var image = {
          contentType: file.mimetype,
          size: file.size,
          img: Buffer.from(encImg, "base64"),
        };
    
        servicesCollection
          .insertOne({ name, description, image })
          .then((result) => {
            res.send(result.insertedCount > 0);
          });
      });



    //To add an admin
    app.post("/addAdmin", (req, res) => {
      const admin = req.body;
      adminsCollection.insertOne(admin).then((result) => {
        res.send(result.insertedCount > 0);
      });
    });


    //To see all services ordered which an admin can only see
    // a user can only see his ordered services whereas an admin sees the all ordered services
    app.get("/allServicesOrdered", (req, res) => {
      ordersCollection.find({})
      .toArray((err, documents) => {
        res.send(documents);
      });
    });
    


    //To check whether a person is admin or not. Use in Sidebar
    app.post("/isAdmin", (req, res) => {
      const email = req.body.email;
      adminsCollection.find({ email: email }).toArray((err, admins) => {
        res.send(admins.length > 0);
      });
    });




});//client.connect

app.listen(process.env.PORT|| 5000)