export function rateLimit({ windowMs = 60000, max = 30 } = {}) {
    const hits = new Map();
  
    return function (req, res, next) {
      const ip =
        req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
        req.socket.remoteAddress ||
        "unknown";
  
      const now = Date.now();
      let entry = hits.get(ip);
  
      if (!entry || now > entry.resetAt) {
        entry = { count: 0, resetAt: now + windowMs };
        hits.set(ip, entry);
      }
  
      entry.count += 1;
  
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
      res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  
      if (entry.count > max) {
        return res.status(429).json({ ok: false, error: "Rate limit exceeded. Try again later." });
      }
  
      next();
    };
  }
  