const express = require("express");
const app = express();

const bodyParser = require("body-parser");
const cors = require("cors");


const port = 5000;
require('dotenv').config()


app.use(cors());
app.use(express.json());

const admin = require("firebase-admin");

var serviceAccount = require("./config/burj-al-arab-b4acf-firebase-adminsdk-z50lo-8d55b339f9.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});



const MongoClient = require("mongodb").MongoClient;
const uri =
  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ywwhy.mongodb.net/burjAlArab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("booking");

  app.post("/addBooking", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
    console.log("Booked");
  });

  app.get("/bookings", (req, res) => {

    const bearer = req.headers.authorization;
   if(bearer && bearer.startsWith('Bearer')){
     const idToken = bearer.split(' ')[1];
    //  console.log({idToken});

         // idToken comes from the client app
    admin
    .auth()
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      const tokenEmail = decodedToken.email;
      const queryEmail = req.query.email;
      // console.log( tokenEmail, queryEmail);
      if(tokenEmail == queryEmail){

        bookings.find({email : queryEmail})
        .toArray((err ,documents) =>{
          res.send(documents);
        })

      }else{
        res.status(401).send('un-authorised acces');

      }
      
    })
    .catch((error) => {
      res.status(401).send('un-authorised acces');
     
    });
   }
   else {
     res.status(401).send('un-authorised acces');
   }



   
  });
});

app.listen(port);
