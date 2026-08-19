'use strict';

const { auth, db } = require('../config/firebase');
const {
  DEFAULT_ROLE,
  normalizeRole,
  isValidRole,
} = require('../constants/roles');

function normalizeTrustedRole(value) {
  const role = normalizeRole(value);
  return isValidRole(role) ? role : null;
}

function getBearerToken(req) {
  const authorization =
    req &&
    req.headers &&
    typeof req.headers.authorization === 'string'
      ? req.headers.authorization.trim()
      : '';

  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() : '';
}

function logAuthenticationEvent(event, error) {
  const code =
    error && typeof error.code === 'string'
      ? error.code
      : 'unknown';

  console.warn(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      code,
    })
  );
}

async function resolveAuthenticatedRole(decodedToken) {
  const customClaimRole = normalizeTrustedRole(
    decodedToken && decodedToken.role
  );

  try {
    const userDoc = await db
      .collection('users')
      .doc(decodedToken.uid)
      .get();

    if (userDoc.exists) {
      const data = userDoc.data() || {};
      const firestoreRole = normalizeTrustedRole(data.role);

      if (firestoreRole) {
        return firestoreRole;
      }

      logAuthenticationEvent(
        'authentication_invalid_firestore_role',
        { code: 'invalid-role' }
      );

      return DEFAULT_ROLE;
    }
  } catch (error) {
    logAuthenticationEvent(
      'authentication_role_lookup_failed',
      error
    );

    return DEFAULT_ROLE;
  }

  return customClaimRole || DEFAULT_ROLE;
}

async function verifyAuth(req, res, next) {
  try {
    const idToken = getBearerToken(req);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication token is required.',
      });
    }

    const decodedToken =
      await auth.verifyIdToken(
        idToken,
        true
      );

    const userRecord =
      await auth.getUser(
        decodedToken.uid
      );

    if (userRecord.disabled) {
      return res.status(403).json({
        success: false,
        code: 'ACCOUNT_DISABLED',
        message: 'User account is disabled.',
      });
    }

    const role = await resolveAuthenticatedRole(decodedToken);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      phoneNumber: decodedToken.phone_number || null,
      role,
      authTime: decodedToken.auth_time || null,
    };

    return next();
  } catch (error) {
    logAuthenticationEvent(
      'authentication_verification_failed',
      error
    );

    return res.status(401).json({
      success: false,
      code: 'AUTHENTICATION_INVALID',
      message:
        'Invalid, expired or revoked authentication token.',
    });
  }
}

module.exports = verifyAuth;
module.exports.getBearerToken = getBearerToken;
module.exports.normalizeTrustedRole = normalizeTrustedRole;
module.exports.resolveAuthenticatedRole =
  resolveAuthenticatedRole;
