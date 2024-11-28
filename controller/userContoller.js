require("dotenv").config();

const bcrypt = require("bcrypt");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const generateTokens = require("../utils/generateToken");
const {
  signUpBodyValidation,
  logInBodyValidation,
} = require("../utils/validateSchema");

module.exports = {
  register: async (req, res) => {
    try {
        // console.log("yes")
      const { error } = signUpBodyValidation(req.body);
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      const { name, email, password } = req.body;

      const exisitingUser = await User.findOne({ email });

      if (exisitingUser) {
        return res
          .status(400)
          .json({ message: "User email is already in use" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        ...req.body,
        password: hashedPassword,
      });

      if (user) {
        return res
          .status(201)
          .json({ message: "User is registered successfully" });
      }
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Internal server errror" });
    }
  },

  //login Controller
  login: async (req, res) => {
    try {
      const { error } = logInBodyValidation(req.body);
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      const { email, password } = req.body;
     
      const user = await User.findOne({ email });
      if (!user)return res.status(401).json({ message: "User doesn't exist" });

      const matchPassword =await bcrypt.compare(password, user.password);

      if (!matchPassword){
       return res.status(401).json({ message: "Password is wrong" });}
      const { refreshToken, accessToken } = await generateTokens(user);
      const expires = new Date(Date.now() + 1000 * 60 * 60 * 24);
      res.cookie("refreshToken", refreshToken, { httpOnly: true,sameSite: 'None',secure:false,expires })
        .json({message:"User got logged In successfully",user,accessToken});
    } catch (error) {
        console.log(error)
      return res.status(500).json({ message: "Internal server error", error });
    }
  },
  getUserWithDocuments:async(req,res)=> {
    try {
    const id = req.user._id;// Email of the requesting user
      const user = await User.findById(id).populate("documents");
      if (!user) {
        return res.status(400).json({ message: "User doesn't exist" });
      }
      console.log("User with documents:", user);
      return res.status(200).json({message:"Sucessfully loaded the documents for "+user.name,user});
    } catch (error) {
      console.error("Error fetching user documents:", error.message);
      return res.status(500).json({ message: "Internal server error", error });
    }
  }
  
};