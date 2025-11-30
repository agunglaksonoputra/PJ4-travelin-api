const rateLimit = require('express-rate-limit');

// General purpose rate limiter for the entire API or selected routes
// Window: 15 minutes, Max: 50 requests per IP
// Uses standard headers (RateLimit-*) and no legacy headers
const generalRateLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 50,
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		res.status(429).json({
			success: false,
			error: 'Too many requests, please try again later.',
		});
	},
});

module.exports = { generalRateLimiter };

