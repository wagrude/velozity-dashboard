export const authConfig = {
  accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
  accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
};
