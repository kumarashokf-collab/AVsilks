const { admin, db } = require("../config/firebase");

async function verifyAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required."
      });
    }

    const idToken = authorization.substring(7).trim();

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required."
      });
    }

    // Verify token + check revocation
    const decodedToken = await admin.auth().verifyIdToken(idToken, true);

    // Check disabled user
    const userRecord = await admin.auth().getUser(decodedToken.uid);

    if (userRecord.disabled) {
      return res.status(403).json({
        success: false,
        message: "User account is disabled."
      });
    }

    // Default role
    let role = decodedToken.role || null;

    // Firestore role fallback
    try {
      const userDoc = await db.collection("users").doc(decodedToken.uid).get();

      if (userDoc.exists && userDoc.data().role) {
        role = userDoc.data().role;
      }
    } catch (_) {
      // Ignore Firestore lookup errors here.
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phoneNumber: decodedToken.phone_number || null,
      role,
      authTime: decodedToken.auth_time || null
    };

    return next();

  } catch (error) {

    console.error("verifyAuth:", error.code || error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid, expired or revoked authentication token."
    });
  }
}

module.exports = verifyAuth;
