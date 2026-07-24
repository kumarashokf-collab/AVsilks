'use strict';

const AUTHORIZATION_EVENT = 'authorization_denied';

function normalizeText(value, fallback = 'unknown') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  return normalized || fallback;
}

function safeRequestPath(req) {
  if (!req || typeof req !== 'object') {
    return 'unknown';
  }

  const value =
    typeof req.originalUrl === 'string'
      ? req.originalUrl
      : typeof req.path === 'string'
        ? req.path
        : 'unknown';

  return value.split('?')[0].slice(0, 200);
}

function logAuthorizationDenied(req, details = {}) {
  try {
    const event = {
      timestamp: new Date().toISOString(),
      event: AUTHORIZATION_EVENT,
      reason: normalizeText(details.reason),
      method: normalizeText(req && req.method),
      path: safeRequestPath(req),
      role: normalizeText(req && req.user && req.user.role, 'none'),
    };

    if (Array.isArray(details.requiredPermissions)) {
      event.requiredPermissions = details.requiredPermissions
        .filter((permission) => typeof permission === 'string')
        .map((permission) => permission.trim().toLowerCase())
        .filter(Boolean);
    }

    if (Array.isArray(details.allowedRoles)) {
      event.allowedRoles = details.allowedRoles
        .filter((role) => typeof role === 'string')
        .map((role) => role.trim().toLowerCase())
        .filter(Boolean);
    }

    console.warn(JSON.stringify(event));
  } catch {
    console.warn(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        event: AUTHORIZATION_EVENT,
        reason: 'audit_logging_failure',
      })
    );
  }
}

module.exports = {
  logAuthorizationDenied,
};
