const isProd = process.env.NODE_ENV === 'production';

// 7 days in milliseconds (matches default JWT_EXPIRES_IN)
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const COOKIE_NAME = 'auth_token';

const cookieOptions = {
  httpOnly: true,            // JS cannot read it → immune to XSS token theft
  secure: isProd,            // HTTPS only in production (localhost dev is http)
  sameSite: 'lax',           // first-party (frontend proxies /api to backend)
  maxAge: COOKIE_MAX_AGE,
  path: '/',
};

/** Set the auth JWT as an httpOnly cookie on the response. */
const setAuthCookie = (res, token) => {
  res.cookie(COOKIE_NAME, token, cookieOptions);
};

/** Clear the auth cookie (logout). */
const clearAuthCookie = (res) => {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
};

module.exports = { setAuthCookie, clearAuthCookie, COOKIE_NAME };
