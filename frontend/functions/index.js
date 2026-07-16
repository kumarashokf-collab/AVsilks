const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");

setGlobalOptions({
  maxInstances: 2,
  region: "asia-south1"
});

exports.api = onRequest((req, res) => {
  res.status(200).json({
    success: true,
    status: "Active",
    message: "AV Silks Firebase Function is working"
  });
});
