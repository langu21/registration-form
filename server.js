
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer'); // For handling file uploads
const cors = require('cors'); // For enabling Cross-Origin Resource Sharing

// 2. Initialize the Express app
const app = express();

// 3. Connect to your database (e.g., MongoDB)
// IMPORTANT: Replace 'mongodb://localhost:27017/registration_db' with your actual MongoDB connection string
mongoose.connect('mongodb://localhost:27017/registration_db', {
  // These options are deprecated in newer Mongoose versions but are harmless to keep for now.
  // You can remove them if you wish to clear the warnings.
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected successfully!')) // Added "successfully!" for clarity
  .catch(err => console.error('MongoDB connection error:', err)); // Use console.error for errors

// 4. Set up middleware
// CORS middleware MUST be placed BEFORE your routes to allow cross-origin requests
app.use(cors());
app.use(express.json()); // For parsing application/json request bodies (if you send JSON)
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded request bodies

// Configure Multer for file uploads
// 'uploads/' is the directory where uploaded files will be stored. Make sure this directory exists in your backend folder.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the 'uploads/' directory
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent overwrites, using original extension
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// 5. Define your Mongoose model
// This schema defines the structure of documents in your 'registrations' collection
const RegistrationSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  schoolCollegeName: { type: String },
  dob: { type: Date }, // Store Date of Birth as a Date object
  cityState: { type: String },
  gender: { type: String },
  category: { type: [String] }, // Store multiple categories as an array of strings
  otherCategory: { type: String },
  participationType: { type: String },
  description: { type: String },
  social: { type: String },
  requirements: { type: String },
  confirmation: { type: Boolean }, // Store checkbox value as a boolean
  profilePhotoName: { type: String } // Store the filename of the uploaded photo
});

// Create the Mongoose model from the schema
const Registration = mongoose.model('Registration', RegistrationSchema);

// 6. Define your routes
// This route handles POST requests to '/api/register' for form submissions
// 'upload.single('profileUpload')' tells Multer to expect a single file with the field name 'profileUpload'
app.post('/api/register', upload.single('profileUpload'), async (req, res) => {
  try {
    const rawData = req.body; // Contains all text fields from the form
    const file = req.file;   // Contains file information (if uploaded) from Multer

    console.log('Received raw form data:', rawData);
    console.log('Received file info:', file);

    // Prepare the data for saving to MongoDB
    const registrationData = {
      firstName: rawData.firstName,
      lastName: rawData.lastName,
      schoolCollegeName: rawData.schoolCollegeName,
      dob: rawData.dob ? new Date(rawData.dob) : null, // Convert date string to Date object
      cityState: rawData.cityState,
      gender: rawData.gender,
      // Handle 'category' which can be a single string or an array of strings
      category: rawData.category ? (Array.isArray(rawData.category) ? rawData.category : [rawData.category]) : [],
      otherCategory: rawData.otherCategory,
      participationType: rawData.participationType,
      description: rawData.description,
      social: rawData.social,
      requirements: rawData.requirements,
      confirmation: rawData.confirmation === 'on', // Convert 'on' from checkbox to true
      profilePhotoName: file ? file.filename : null // Save the Multer-generated filename
    };

    // Create a new Registration document using the Mongoose model
    const newRegistration = new Registration(registrationData);
    // Save the document to MongoDB
    await newRegistration.save();

    console.log('New registration saved to database:', newRegistration); // Added "to database" for clarity
    // Send a success response back to the client
    res.status(200).json({ message: 'Registration submitted successfully!' });
  } catch (error) {
    // Log the full error to the console for debugging
    console.error('Error saving registration:', error);
    // Send an error response back to the client
    res.status(500).json({ message: 'Submission failed. Please try again.', error: error.message });
  }
});

// 7. Start the server
const PORT = process.env.PORT || 3000; // Server will listen on port 3000 or an environment-defined port
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
