const router = require("express").Router();
const {
  login,register,getUserWithDocuments
} = require("../controller/userContoller");
const auth = require("../middleware/auth");



router.post("/login", login);
router.post("/register", register);
router.get("/documents",auth,getUserWithDocuments);


module.exports = router;