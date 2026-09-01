// This goes in: /api/index.js (at root level, NOT in backend/)
// This is the Vercel serverless function entry point

import app from "../api.js";

export default function handler(req, res) {
  // Handle Express app in serverless context
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
    });
    res.on('finish', () => resolve());
  });
}