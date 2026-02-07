import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
  const { password, ...safeUser } = user || {};
  const payload = { id: safeUser.id, user: safeUser };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  return token;
};
