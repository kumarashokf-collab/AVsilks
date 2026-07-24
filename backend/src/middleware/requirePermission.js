const {
  PERMISSIONS,
  isValidPermission
} = require("../constants/permissions");

const {
  ROLE_PERMISSIONS
} = require("../constants/rolePermissions");
const {
  logAuthorizationDenied
} = require("../security/authorizationAudit");

const GLOBAL_WILDCARD = "*";

function normalizePermission(value) {
  return typeof value === "string"
    ? value.trim().toLowerCase()
    : "";
}

function matchesPermission(grantedPermission, requiredPermission) {
  if (grantedPermission === GLOBAL_WILDCARD) {
    return true;
  }

  if (grantedPermission === requiredPermission) {
    return true;
  }

  if (grantedPermission.endsWith(".*")) {
    const resourcePrefix = grantedPermission.slice(0, -1);
    return requiredPermission.startsWith(resourcePrefix);
  }

  return false;
}

function roleHasPermission(role, requiredPermission) {
  const grantedPermissions = ROLE_PERMISSIONS[role];

  if (!Array.isArray(grantedPermissions)) {
    return false;
  }

  return grantedPermissions.some((grantedPermission) =>
    matchesPermission(grantedPermission, requiredPermission)
  );
}

function requirePermission(...requiredPermissions) {
  const normalizedRequiredPermissions = [
    ...new Set(
      requiredPermissions
        .flat()
        .map(normalizePermission)
        .filter(Boolean)
    )
  ];

  if (normalizedRequiredPermissions.length === 0) {
    throw new Error(
      "requirePermission requires at least one permission."
    );
  }

  const invalidPermissions = normalizedRequiredPermissions.filter(
    (permission) => !isValidPermission(permission)
  );

  if (invalidPermissions.length > 0) {
    throw new Error(
      `requirePermission received invalid permission(s): ${invalidPermissions.join(", ")}`
    );
  }

  return function permissionAuthorizationMiddleware(req, res, next) {
    if (!req.user || !req.user.uid) {
        logAuthorizationDenied(req, {
          reason: "authentication_missing",
          requiredPermissions: normalizedRequiredPermissions
        });

        return res.status(401).json({
        success: false,
        message: "Authentication is required."
      });
    }

    const role =
      typeof req.user.role === "string"
        ? req.user.role.trim().toLowerCase()
        : "";

    if (!role || !ROLE_PERMISSIONS[role]) {
        logAuthorizationDenied(req, {
          reason: "invalid_role",
          requiredPermissions: normalizedRequiredPermissions
        });

        return res.status(403).json({
        success: false,
        message: "A valid authorized role is required."
      });
    }

    const missingPermissions = normalizedRequiredPermissions.filter(
      (permission) => !roleHasPermission(role, permission)
    );

    if (missingPermissions.length > 0) {
        logAuthorizationDenied(req, {
          reason: "missing_permission",
          requiredPermissions: missingPermissions
        });

        return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource."
      });
    }

    req.authorization = {
      role,
      requiredPermissions: [...normalizedRequiredPermissions]
    };

    return next();
  };
}

module.exports = {
  requirePermission,
  roleHasPermission,
  matchesPermission,
  PERMISSIONS
};
