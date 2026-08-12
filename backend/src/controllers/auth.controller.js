'use strict';

const {
  normalizeRole,
  isValidRole,
} = require('../constants/roles');

function sanitizeAuthenticatedUser(user) {
  const uid =
    typeof user?.uid === 'string'
      ? user.uid.trim()
      : '';

  const role = normalizeRole(user?.role);

  if (!uid || !isValidRole(role)) {
    return null;
  }

  return Object.freeze({
    uid,
    role,
  });
}

function getAuthSession(req, res) {
  const session =
    sanitizeAuthenticatedUser(req?.user);

  if (!session) {
    return res.status(401).json({
      success: false,
      code: 'AUTHENTICATION_REQUIRED',
      message: 'Authentication is required.',
    });
  }

  return res.status(200).json({
    success: true,
    data: session,
  });
}

module.exports = {
  sanitizeAuthenticatedUser,
  getAuthSession,
};
