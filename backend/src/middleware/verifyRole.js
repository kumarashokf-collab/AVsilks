const { ROLES } = require("../constants/roles");
const {
  logAuthorizationDenied
} = require("../security/authorizationAudit");

const VALID_ROLES = new Set(Object.values(ROLES));

function verifyRole(...allowedRoles) {
  const normalizedAllowedRoles = [
    ...new Set(
      allowedRoles
        .flat()
        .filter((role) => typeof role === "string")
        .map((role) => role.trim().toLowerCase())
    )
  ];

  if (normalizedAllowedRoles.length === 0) {
    throw new Error("verifyRole requires at least one allowed role.");
  }

  const invalidRoles = normalizedAllowedRoles.filter(
    (role) => !VALID_ROLES.has(role)
  );

  if (invalidRoles.length > 0) {
    throw new Error(
      `verifyRole received invalid role(s): ${invalidRoles.join(", ")}`
    );
  }

  const allowedRoleSet = new Set(normalizedAllowedRoles);

  return function roleAuthorizationMiddleware(req, res, next) {
    if (!req.user || !req.user.uid) {
        logAuthorizationDenied(req, {
          reason: "authentication_missing",
          allowedRoles: normalizedAllowedRoles
        });

        return res.status(401).json({
        success: false,
        message: "Authentication is required."
      });
    }

    const userRole =
      typeof req.user.role === "string"
        ? req.user.role.trim().toLowerCase()
        : null;

    if (!userRole || !VALID_ROLES.has(userRole)) {
        logAuthorizationDenied(req, {
          reason: "invalid_role",
          allowedRoles: normalizedAllowedRoles
        });

        return res.status(403).json({
        success: false,
        message: "A valid account role is required."
      });
    }

    if (!allowedRoleSet.has(userRole)) {
        logAuthorizationDenied(req, {
          reason: "role_not_allowed",
          allowedRoles: normalizedAllowedRoles
        });

        return res.status(403).json({
        success: false,
        message: "You do not have permission to access this resource."
      });
    }

    return next();
  };
}

module.exports = {
  verifyRole
};
