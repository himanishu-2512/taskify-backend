const express = require("express");
const mongoose = require("mongoose");
const userRoutes = require("./routes/userRoutes");
const documentRoutes = require("./routes/documentRoutes");
const app = express();
const cors = require('cors');
const cookieParser = require("cookie-parser");


// Middleware to parse JSON
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000',  // Allow only this domain to make requests
  credentials: true,
}));
app.use(cookieParser());



// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/document", documentRoutes);

app.get("/",(req,res)=>{
  res.send("hello ra")
})
// Connect to MongoDB
mongoose.connect(process.env.DB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Failed to connect to MongoDB", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
