const { ROLES } = require("./roles");
const {
  VALID_PERMISSIONS,
  isValidPermission
} = require("./permissions");
const { ROLE_PERMISSIONS } = require("./rolePermissions");

const GLOBAL_WILDCARD = "*";

function isValidScopedWildcard(value) {
  if (typeof value !== "string" || !value.endsWith(".*")) {
    return false;
  }

  const resource = value.slice(0, -2);

  if (!resource) {
    return false;
  }

  return [...VALID_PERMISSIONS].some((permission) =>
    permission.startsWith(`${resource}.`)
  );
}

function validateRbacConfiguration() {
  const validRoles = new Set(Object.values(ROLES));
  const configuredRoles = Object.keys(ROLE_PERMISSIONS);

  const missingRoles = [...validRoles].filter(
    (role) => !configuredRoles.includes(role)
  );

  const unknownRoles = configuredRoles.filter(
    (role) => !validRoles.has(role)
  );

  const invalidEntries = [];

  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (!Array.isArray(permissions)) {
      invalidEntries.push(`${role}: permissions must be an array`);
      continue;
    }

    const seenPermissions = new Set();

    for (const permission of permissions) {
      if (typeof permission !== "string" || permission.trim() === "") {
        invalidEntries.push(`${role}: invalid empty permission`);
        continue;
      }

      const normalizedPermission = permission.trim().toLowerCase();

      if (seenPermissions.has(normalizedPermission)) {
        invalidEntries.push(
          `${role}: duplicate permission ${normalizedPermission}`
        );
        continue;
      }

      seenPermissions.add(normalizedPermission);

      const isAllowed =
        normalizedPermission === GLOBAL_WILDCARD ||
        isValidPermission(normalizedPermission) ||
        isValidScopedWildcard(normalizedPermission);

      if (!isAllowed) {
        invalidEntries.push(
          `${role}: unknown permission ${normalizedPermission}`
        );
      }
    }
  }

  const errors = [];

  if (missingRoles.length > 0) {
    errors.push(`Missing role mappings: ${missingRoles.join(", ")}`);
  }

  if (unknownRoles.length > 0) {
    errors.push(`Unknown role mappings: ${unknownRoles.join(", ")}`);
  }

  if (invalidEntries.length > 0) {
    errors.push(...invalidEntries);
  }

  if (errors.length > 0) {
    throw new Error(
      `RBAC configuration validation failed:\n- ${errors.join("\n- ")}`
    );
  }

  return Object.freeze({
    valid: true,
    roleCount: validRoles.size,
    permissionCount: VALID_PERMISSIONS.size
  });
}

module.exports = {
  validateRbacConfiguration,
  isValidScopedWildcard
};
