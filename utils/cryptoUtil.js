const crypto = require("crypto");

exports.randomHex = (bytes = 4) => {
    return crypto.randomBytes(bytes).toString("hex").toUpperCase();
};
