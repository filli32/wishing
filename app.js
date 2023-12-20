const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

// Connect to the MongoDB database
const db = ('mongodb+srv://orginal:dbpassword12@cluster2.t8mcaqt.mongodb.net/Cluster2?retryWrites=true&w=majority');
mongoose.set('strictQuery', false);

mongoose.connect(db, {
  
}).then(() => {
  console.log('Connection to database successful...');
}).catch((err) =>{
  console.log(err,'Unable to connect to database');
});
 
// Define a mongoose schema for the birthday wish
const BirthdayWishSchema = new mongoose.Schema({
  wisher: String,
  recipientName: String,
  message: String,
  image: String,
  uniqueUrl: { type: String, default: shortid.generate },
});

// Create a mongoose model for the birthday wish
const BirthdayWish = mongoose.model('BirthdayWish', BirthdayWishSchema);

app.get('/public', express.static('public')); 

// Set up middleware to handle JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// middleware to parse incoming requests
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Set up multer middleware for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '/public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});


const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 7 } // max 7 MB
  });

  // const myRoutes = require('./src/url'); // Import the url.js file

  // app.use('/', myRoutes); // Use the imported routes


// Serve the HTML form when a GET request is made to the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

app.get('/wishpage', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/wishpage.html'));
});
app.get('/urlpage',(req ,res) => {
  res.sendFile(path.join(__dirname, '/public/urlpage.html' ))
})

// Handle form submissions when a POST request is made to the root URL
app.post('/submit-form', upload.single('image'), (req, res) => {
  const wisher = req.body.wisher;
  const recipientName = req.body.recipientName;
  const message = req.body.message;
  const image = req.file;


  const newWish = new BirthdayWish({
    wisher:  wisher,
    recipientName:recipientName,
    message: message,
    image: image ? image.filename : null,
  });

  // Save the birthday wish to the database
 
newWish.save()
.then(() => {
    // Send a response to the client with the unique URL
  const url = `${req.protocol}://${req.get('host')}/wish/${newWish.uniqueUrl}`;
  res.send(` Your unique URL is: <a href="${url}">${url}</a>`);
}).catch(err =>
  {console.log(err);
    res.status(500).send('Error saving birthday wish');
  });});



// Serve the birthday wish when a GET request is made to the unique URL
app.get('/wish/:uniqueUrl', (req, res) => {
  // Find the birthday wish in the database using the unique URL
  BirthdayWish.findOne({ uniqueUrl: req.params.uniqueUrl })
    .then(result => {
      if (!result) {
        res.status(404).send('Birthday wish not found');
      } else {
        const wish = {
          wisher: result.wisher,
          recipientName: result.recipientName,
          message: result.message,
          image: result.image ? `/uploads/${result.image}` : null,
        };

        res.render('wish', { wish });
      }
    })
    .catch(err => {
      console.log(err);
      res.status(500).send('Error retrieving birthday wish');
    });
});

//set up the url page
app.get('/url',(req ,res) => {
  res.render('url')
})

// Set up the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Set up a route to handle errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
  });
// Serve static files from the public directory
app.use(express.static('public'));

// Handle 404 errors
app.use((req, res, next) => {
  res.status(404).send(`404: Page not found`);
});

// Handle server errors
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send('500: Internal server error');
});


app.listen(process.env.PORT ||80 , () => {
  console.log('Server listening on port 3000'); 
});

// console.log(`this is your url ${url}`) // useNewUrlParser: true,
  // useUnifiedTopology: true,


