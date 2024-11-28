const express = require("express");
const { createDocument, getDocumentVersions,fetchDocument,updateDocument, changeVisibility, addPermission } = require("../controller/documentController");
const auth = require("../middleware/auth");

const router = express.Router();

// POST: Create a new document
router.post("/create",auth, createDocument);
router.get("/:documentId/versions",auth, getDocumentVersions);
router.get("/:documentId",auth,fetchDocument);
router.post("/:documentId/add-permission",auth,addPermission);
router.post("/:documentId/update",auth,updateDocument);
router.post("/:documentId/change-visibility",auth,changeVisibility);


module.exports = router;
