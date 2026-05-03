const express = require("express");

const mongoose = require("mongoose");
const cookieParser = require('cookie-parser')
const cors = require("cors");


const authRouter = require("./Routes/auth");
const authenticationMiddleware = require('./Middleware/authenticationMiddleware')
const { optional: optionalAuthenticationMiddleware } = require('./Middleware/authenticationMiddleware');
const userRouter = require("./Routes/user");
const eventRouter = require("./Routes/eventroute");
const bookingRouter = require("./Routes/bookingroute");


const app = express();

app.use(express.json({ limit: '10mb' })); // allow larger JSON payloads for image uploads
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

app.use(cookieParser())
app.use(
    cors({
        origin: ["http://localhost:5173", "http://localhost:5174"],
        methods: ["GET", "POST", "DELETE", "PUT"],
        credentials: true,
    })
);


app.use("/api/v1", authRouter);
// Apply authentication middleware only to protected routes
app.use("/api/v1/users", authenticationMiddleware, userRouter);
app.use("/api/v1/events", optionalAuthenticationMiddleware, eventRouter);
app.use("/api/v1/bookings", authenticationMiddleware, bookingRouter);

const db_name = "Bookings";
const db_url = `mongodb://localhost:27017/${db_name}`;

const connectionOptions = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};

mongoose
    .connect(db_url, connectionOptions)
    .then(() => console.log("mongoDB connected"))
    .catch((e) => {
        console.log(e);
    });

app.use((req, res) => {
    return res.status(404).send("404");
});
app.listen(3000, () => console.log("server started"));