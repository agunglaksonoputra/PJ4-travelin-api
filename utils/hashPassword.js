const bcrypt = require("bcrypt");

exports.hashPassword = async (password, saltRounds = 10) => {
    return await bcrypt.hash(password, saltRounds);
};

exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
