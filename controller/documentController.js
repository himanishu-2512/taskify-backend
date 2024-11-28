const Document = require("../model/document");
const User = require("../model/user");

// Create a new document
const createDocument = async (req, res) => {
  try {
    const id = req.user._id;
    const { title, description } = req.body;

    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User doesn't exist" });
    }
    // Create a new document with default access set to "private"
    const newDocument = new Document({
      title,
      description,
      access: "private", // Default access control is private
      permissions: [], // No permissions initially
      owner: user.email,
      versions: [
        {
          versionNumber: `${title}+${Date.now().toString()}`,
          content: "",
          updatedAt: Date.now(),
          updatedBy: user.email,
        },
      ],
    });
    user.documents.push(newDocument._id);
    // Save the document to the database
    await user.save();
    await newDocument.save();
    return res
      .status(201)
      .json({
        message: "Document created successfully",
        document: newDocument,
      });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error creating document", error: err.message });
  }
};

// Fetch last 10 versions of a document
const getDocumentVersions = async (req, res) => {
  try {
    const { documentId } = req.params;
    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Get the last 10 versions
    const lastVersions = document.versions.slice(-10).reverse(); // Get last 10 versions

    return res.status(200).json({
      title: document.title,
      access: document.access,
      description: document.description,
      versions: lastVersions,
    });
  } catch (err) {
    return res
      .status(500)
      .json({
        message: "Error fetching document versions",
        error: err.message,
      });
  }
};

// Check if user has permission to edit a document
const checkUserPermission = (permissions, userEmail) => {
  const userPermission = permissions.find(
    (permission) => permission.email === userEmail
  );
  return userPermission ? userPermission.accessLevel : "no access";
};

// Update document (title, description, content)
const updateDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const id = req.user._id;
    const user = await User.findById(id);
    const { title, description, content } = req.body;

    if (!user) return res.status(400).json({ message: "User is not valid" });

    // Ensure the required fields are provided
    if (!title && !description && !content) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the user is the owner or has 'can edit' access
    const userPermission = checkUserPermission(
      document.permissions,
      user.email
    );

    if (userPermission !== "can edit" && document.owner !== user.email) {
      return res
        .status(403)
        .json({ message: "You do not have permission to edit this document" });
    }

    // Update the title, description, or content if provided
    if (title) {
      document.title = title;
    }
    if (description) {
      document.description = description;
    }
    if (content) {
      const now = new Date();
      const day = now.getDate(); // Day of the month (1-31)
      const month = now.getMonth() + 1; // Month (0-11, so we add 1)
      const year = now.getFullYear(); // Full year
      const hours = now.getHours(); // Hours (0-23)
      const minutes = now.getMinutes(); // Minutes (0-59)
      const seconds = now.getSeconds(); // Seconds (0-59)

      const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

      // Increment version number for content update
      // console.log(content);
      const newVersion = {
        versionNumber: formattedDateTime,
        content: content,
        updatedAt: Date.now(),
        updatedBy: user.email,
      };
      // console.log(content);
      document.versions.push(newVersion);
    }

    // Save the document after making the updates
    await document.save();

    return res.status(200).json({
      message: "Document updated successfully",
      document: {
        title: document.title,
        description: document.description,
        content: document.versions[document.versions.length - 1].content,
        access: document.access,
        versions: document.versions.reverse(),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error updating document", error: err.message });
  }
};

// Check if user has permission to view a document
const checkUserAccess = (permissions, userEmail) => {
  const userPermission = permissions.find(
    (permission) => permission.email === userEmail
  );
  return userPermission ? userPermission.accessLevel : "no access";
};

// Fetch document with access validation
const fetchDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const id = req.user._id; // Email of the requesting user
    const user = await User.findById(id);
    if (!user) {
      return res.status(401).json({ message: "User is not valid" });
    }

    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Check if the document is public or the user has permissions
    const userAccess = checkUserAccess(document.permissions, user.email);

    if (
      document.access === "public" ||
      userAccess === "can read" ||
      userAccess === "can edit" ||
      document.owner === user.email
    ) {
      return res.status(200).json({
        message: "Document fetched successfully",
        document: {
          title: document.title,
          access:document.access,
          description: document.description,
          latestContent:
            document.versions[document.versions.length - 1].content,
          access: document.access,
          userAccess: userAccess,
          versions: document.versions
            .slice(-10) // Return the last 10 versions
            .map((version) => ({
              versionNumber: version.versionNumber,
              content: version.content,
              updatedBy: version.updatedBy,
              updatedAt: version.updatedAt,
            }))
            .reverse(),
        },
      });
    }

    // If the document is private and the user does not have access
    return res
      .status(403)
      .json({ message: "You do not have access to view this document" });
  } catch (err) {
    return res
      .status(500)
      .json({ message: "Error fetching document", error: err.message });
  }
};

// Add permission for a user to a document
const addPermission = async (req, res) => {
  try {
    const id = req.user._id; // Email of the requesting user
    const user = await User.findById(id);
    if (!user) {
      return res.status(400).json({ message: "User is not valid" });
    }
    const { documentId } = req.params;
    const { targetUserEmail, accessLevel } = req.body;

    // Validate access level
    if (!["can read", "can edit", "no access"].includes(accessLevel)) {
      return res.status(401).json({
        message: "Invalid access level. Must be 'can read', 'can edit', or 'no access'.",
      });
    }

    // Find the document by ID
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Ensure the current user is the owner of the document
    if (document.owner !== user.email) {
      return res.status(403).json({ message: "Only the document owner can add permissions." });
    }

    // Check if the target user already has permissions
    const permissionIndex = document.permissions.findIndex(
      (permission) => permission.email === targetUserEmail
    );

    if (accessLevel === "no access") {
      if (permissionIndex !== -1) {
        // Remove the permission if it exists
        document.permissions.splice(permissionIndex, 1);
        await document.save();
        return res.status(200).json({
          message: `Access for user '${targetUserEmail}' has been revoked.`,
          document,
        });
      } else {
        // Do nothing if the user doesn't have access
        return res.status(200).json({
          message: `User '${targetUserEmail}' already has no access.`,
        });
      }
    }

    if (permissionIndex !== -1) {
      // Update the existing permission
      document.permissions[permissionIndex].accessLevel = accessLevel;
    } else {
      // Add new permission
      document.permissions.push({ email: targetUserEmail, accessLevel });
    }

    // Save the updated document
    await document.save();

    return res.status(200).json({
      message: `Permission '${accessLevel}' granted to user '${targetUserEmail}'`,
      document,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error adding permission",
      error: err.message,
    });
  }
};


const changeVisibility = async (req, res) => {
  const id = req.user._id; // Email of the requesting user
  const user = await User.findById(id);

  if (!user) {
    return res.status(400).json({ message: "User is not valid" });
  }
  const { visibility } = req.body; // New visibility status
  const { documentId } = req.params;

  try {
    // Validate visibility
    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ error: "Invalid visibility option." });
    }

    // Find the document
    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ error: "Document not found." });
    }

    // Check if the user is the owner or has editor access
    const isOwner = document.owner === user.email;

    if (!isOwner) {
      return res.status(403).json({ error: "Permission denied." });
    }

    // Update visibility
    document.access = visibility;
    await document.save();

    res.status(200).json({
      message: "Document visibility updated successfully.",
      document,
    });
  } catch (error) {
    console.error("Error updating visibility:", error.message);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  createDocument,
  getDocumentVersions,
  updateDocument,
  fetchDocument,
  addPermission,
  changeVisibility,
};
