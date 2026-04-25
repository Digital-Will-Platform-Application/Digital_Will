/**
 * @param {import('express').Response} res
 * @returns {string | null} secret or null after sending 503
 */
export function getJwtSecretOrRespond(res) {
  const secret = process.env.JWT_SECRET;
  const s = secret != null ? String(secret).trim() : '';
  if (s.length < 16) {
    console.error('[auth] JWT_SECRET is missing or shorter than 16 characters.');
    res.status(503).json({
      success: false,
      message: 'Server is misconfigured (JWT_SECRET). Set a long random secret in the API environment.',
    });
    return null;
  }
  return s;
}
