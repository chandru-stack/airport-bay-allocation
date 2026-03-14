import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is missing in environment variables");
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";

export function signToken(payload) {
  // You can also add issuer/audience later if needed
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    algorithm: "HS256",
  });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ["HS256"],
  });
}
