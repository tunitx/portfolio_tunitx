const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const ejs = require('ejs');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

//!! insert these later into env file 
cloudinary.config({
    cloud_name: 'dvrko0bzr',
    api_key: '188551638249943',
    api_secret: 'aLZPOLQJ0LrahpXo6QY8tdYl7Sc',
    secure: true,
});

async function connectToDatabase() {
    try {
        //!! this mongo connect url also
        await mongoose.connect("mongodb+srv://imta819:ChDhME4HPjT8Rg5E@portfolio.aedfx8u.mongodb.net/?retryWrites=true&w=majority", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to MongoDB successfully!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);
    }
}
connectToDatabase();

//todo:: create a schema for the portfolio item
const portfolioItemSchema = new mongoose.Schema({
    cloudinaryImage: String,
    name: String,
    description: String,
    phoneNumber: String,
    email: String
});


const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);

//todo:: create a cloudinary storage to store pfp
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'pfp',
        allowedFormats: ['jpg', 'png'],
        // transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

const parser = multer({ storage });

//todo : create the root route jo saare changable items ko render kare 
app.get('/', async (req, res) => {
    try {
        const portfolioItem = await PortfolioItem.findOne({});
        res.render('portfolio', { portfolioItem });
    } catch (e) {
        console.error(e);
        res.status(500).send('Server Error');
    }
});

//todo : form route and its post req route
app.get('/form', async (req, res) => {
    res.render('form.ejs');
});

app.post('/form', parser.single('photo'), async (req, res) => {
    const { description, phoneNumber, email, name } = req.body;
    const photo = req.file.path;
    try {

        //? delete kar dena puraana obj when user posts new details
        //todo : do the same for cloudinary storage
        await PortfolioItem.deleteMany({});
        const result = await cloudinary.uploader.upload(photo);
        const portfolioItem = new PortfolioItem({
            cloudinaryImage: result.secure_url,
            name,
            description,
            phoneNumber,
            email
        });
        await portfolioItem.save();
        res.redirect('/');
    } catch (e) {
        res.redirect('/form');
    }
});


app.listen(PORT, () => {
    console.log(`server is up at port : ${PORT}`);
});
