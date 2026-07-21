export const ROLES = Object.freeze({
  CUSTOMER: "customer",
  ADMIN: "admin",
  VENDOR: "vendor",
});

export const DEFAULT_ROLE = ROLES.CUSTOMER;

export const VALID_ROLES = Object.freeze(Object.values(ROLES));

export function isValidRole(role) {
  return typeof role === "string" && VALID_ROLES.includes(role.trim().toLowerCase());
}

export function normalizeRole(role) {
  if (!isValidRole(role)) {
    return DEFAULT_ROLE;
  }

  return role.trim().toLowerCase();
}

export function hasRole(currentRole, requiredRole) {
  return normalizeRole(currentRole) === normalizeRole(requiredRole);
}

export function isCustomerRole(role) {
  return normalizeRole(role) === ROLES.CUSTOMER;
}

export function isAdminRole(role) {
  return normalizeRole(role) === ROLES.ADMIN;
}

export function isVendorRole(role) {
  return normalizeRole(role) === ROLES.VENDOR;
}
