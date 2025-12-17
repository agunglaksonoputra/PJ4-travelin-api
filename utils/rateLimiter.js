const rateLimit = require("express-rate-limit");

// General purpose rate limiter for the entire API or selected routes
// Window: 5 minutes, Max: 100 requests per IP
// Uses standard headers (RateLimit-*) and no legacy headers
const generalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: "Too many requests, please try again later.",
    });
  },
});

module.exports = { generalRateLimiter };
