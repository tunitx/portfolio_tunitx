const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const ejs = require('ejs');
const app = express();
const bodyParser = require('body-parser'); 
const PORT = process.env.PORT || 3000;
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

const session = require("express-session");
const mongoSessionStore = require("connect-mongo");

// Auth requires
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
app.use(bodyParser.json());
//!! insert these later into env file 
cloudinary.config({
    cloud_name: 'dvrko0bzr',
    api_key: '188551638249943',
    api_secret: 'aLZPOLQJ0LrahpXo6QY8tdYl7Sc',
    secure: true,
});
const User = require("./models/user");
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

const sessionStore = mongoSessionStore.create({
    collectionName: "sessions",
    mongoUrl: "mongodb+srv://imta819:ChDhME4HPjT8Rg5E@portfolio.aedfx8u.mongodb.net/?retryWrites=true&w=majority",
});
const sessionConfig = {
    secret: 'tunitx_rocks_secret',
    resave: false,
    saveUninitialized: true,
    store: sessionStore,
    cookie: {
        httpOnly: true,
    },
};

app.use(session(sessionConfig));

// using the passport
app.use(passport.initialize());
// this line should be after the middleware for sessions
app.use(passport.session());

// Adding some helper function for user model
const addGoogleUser = async ({ id, email, firstName, lastName, profilePhoto }) => {
    const newUser = await new User({
        id,
        email,
        firstName,
        lastName,
        profilePhoto,
        source: "google",
    });
    return await newUser.save();
};

const getGoogleUserByEmail = async ({ email }) => {
    return await User.findOne({
        email,
    });
};

// * CONFIGURING THE PASSPORT FOR GOOGLE AUTH.
passport.use(
    new GoogleStrategy(
        {
            callbackURL: 'https://tunitx.onrender.com/auth/google/callback',
            clientID: '14808629420-g91de415fiitve0i5am0es99sgrmaep9.apps.googleusercontent.com',
            clientSecret: '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'
        },
        async (accessToken, refreshToken, profile, done) => {
            const id = profile.id;
            const email = profile.emails[0].value;
            const firstName = profile.name.givenName;
            const lastName = profile.name.familyName;
            const profilePhoto = profile.photos[0].value;
            const source = "google";

            const currentUser = await getGoogleUserByEmail({
                email,
            });

            if (!currentUser) {
                const newUser = await addGoogleUser({
                    id,
                    email,
                    firstName,
                    lastName,
                     profilePhoto,
                });
                return done(null, newUser);
            }

            if (currentUser.source != "google") {
                //return error
                return done(null, false, {
                    message: `You have previously signed up with a different signin method`,
                });
            }
            return done(null, currentUser);
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findOne({
        id,
    });
    done(null, user);
});


app.get(
    "/auth/google",
    passport.authenticate("google", {
        scope: ["profile", "email"],
        prompt: "select_account",
    })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", {
        failureRedirect: "/",
        successRedirect: "/",
    })
);
app.get("/auth/logout", (req, res) => {
    req.session.destroy(function () {
      res.clearCookie("connect.sid");
      res.clearCookie("signedIN");
      res.redirect("/");
    });
  });
//todo:: create a schema for the portfolio item
const portfolioItemSchema = new mongoose.Schema({
    cloudinaryImage: String,
    name: String,
    description: String,
    phoneNumber: String,
    email: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});


const Post = mongoose.model('Post', portfolioItemSchema);

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
// app.get('/', async (req, res) => {
//     // console.log(req.user._id);
//     if (!req.user) {
//         return res.redirect("/auth/google");
//     }
//     console.log(req.user);
//     const userId = req.user._id;
//     const currUser = await User.findById(userId)
//         .populate('lastPost')
        
    

//     try {
//         const portfolioItem = await Post.findOne({});
//         res.render('portfolio', { portfolioItem });
//     } catch (e) {
//         console.error(e);
//         res.status(500).send('Server Error');
//     }
// });
app.get('/', async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // Redirect to login if the user is not authenticated
        return res.redirect("/auth/google");
      }
  
      const userId = req.user._id;
  
      
      const userData = await User.findById(userId)
        .populate('lastPost')
        .exec();
  
      if (!userData) {
        return res.status(404).send('trouble');
      }
  
     
      res.render('portfolio', { userData, selectedTheme: userData.selectedTheme });
      
    } catch (error) {
      console.error(error);
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
        const result = await cloudinary.uploader.upload(photo);
        const portfolioItem = new Post({
            cloudinaryImage: result.secure_url,
            name,
            description,
            phoneNumber,
            email,
            user: req.user._id
        });
        await portfolioItem.save();

        req.user.lastPost = portfolioItem._id;
        req.user.save();
        res.redirect('/');
    } catch (e) {
        res.redirect('/form');
    }
});

app.post('/update-theme', async (req, res) => {
    const { theme } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { selectedTheme: theme },
      { new: true }
    );

    res.status(200).json({ message: 'theme updated successfully', updatedUser });
  } catch (error) {
    console.error('error updating theme:', error);
    res.status(500).json({ error: 'internal server error' });
  }
  });
  
app.listen(PORT, () => {
    console.log(`server is up at port : ${PORT}`);
});
