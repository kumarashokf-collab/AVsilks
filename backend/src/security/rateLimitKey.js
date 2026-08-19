'use strict';

const {
  ipKeyGenerator,
} =
  require('express-rate-limit');

const {
  isIP,
} =
  require('node:net');

const UNKNOWN_RATE_LIMIT_KEY =
  'unknown-client';

function normalizeIpCandidate(
  value
) {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : '';

  return isIP(normalized)
    ? normalized
    : '';
}

function getRateLimitKey(
  req
) {
  const requestIp =
    normalizeIpCandidate(
      req?.ip
    );

  if (requestIp) {
    return ipKeyGenerator(
      requestIp
    );
  }

  const socketIp =
    normalizeIpCandidate(
      req?.socket
        ?.remoteAddress
    );

  if (socketIp) {
    return ipKeyGenerator(
      socketIp
    );
  }

  return UNKNOWN_RATE_LIMIT_KEY;
}

module.exports = {
  UNKNOWN_RATE_LIMIT_KEY,
  getRateLimitKey,
};
