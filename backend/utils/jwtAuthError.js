/**
 * User-facing auth errors (never expose JWT_SECRET). Used by /me and /api/admin/*.
 */
export function sendJwtAuthError(res, error) {
  if (error?.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Your session has expired. Please sign in again.',
      hint: 'Admin sessions last 7 days. Use the Login page with your email and password.',
    });
  }
  if (error?.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      code: 'TOKEN_INVALID',
      message: 'Your session is not valid. Please sign in again.',
      hint: 'This often happens after a server update or if the token was corrupted. Super Admins use the same login as everyone else.',
    });
  }
  return res.status(401).json({
    success: false,
    code: 'AUTH_ERROR',
    message: 'Could not verify your session. Please sign in again.',
    hint: error?.message ? String(error.message) : undefined,
  });
}

export function sendMissingToken(res) {
  return res.status(401).json({
    success: false,
    code: 'TOKEN_MISSING',
    message: 'You are not signed in.',
    hint: 'Open Login, enter your email and password, then return to the Admin panel.',
  });
}

export function sendMalformedToken(res) {
  return res.status(401).json({
    success: false,
    code: 'TOKEN_MALFORMED',
    message: 'This sign-in session is out of date.',
    hint: 'Please sign out (if shown) or clear this site’s storage, then sign in again from the Login page.',
  });
}
