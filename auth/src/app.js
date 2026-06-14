import "dotenv/config";
import express from "express"
import morgan from "morgan"
import passport from "passport"
import { Strategy as GoogleStrategy} from "passport-google-oauth20"
import cookies from 'cookie-parser';
import authRoutes from "./routes/auth.routes.js"
import cors from "cors"


const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

app.use(morgan("dev"));
app.use(express.json());
app.use(cookies());
app.use(passport.initialize());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));


passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // User logic here
    return done(null, profile);
  }
));

app.set('trust proxy', 1);

app.get("/_status/healthz", (req, res) => {
    res.status(200).json({ status: "ok"});
})

app.get("/_status/readyz", (req,res) =>{
    res.status(200).json({status: "ready"})
})

app.use("/api/auth", authRoutes);


export default app;