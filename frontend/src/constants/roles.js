export const ROLES = Object.freeze({
  OWNER: "owner",
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  VENDOR: "vendor",
  STAFF: "staff",
  CUSTOMER: "customer",
  DELIVERY_PARTNER: "delivery_partner",
  SUPPORT: "support",
  AUDITOR: "auditor",
  ACCOUNTANT: "accountant",
  MARKETING: "marketing",
  INVENTORY_MANAGER: "inventory_manager",
  DEMO: "demo",
});

export const DEFAULT_ROLE = ROLES.CUSTOMER;

export const VALID_ROLES = Object.freeze(Object.values(ROLES));

export const ADMINISTRATIVE_ROLES = Object.freeze([
  ROLES.OWNER,
  ROLES.SUPER_ADMIN,
  ROLES.ADMIN,
]);

const ADMINISTRATIVE_ROLE_SET = new Set(ADMINISTRATIVE_ROLES);

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

export function isAdministrativeRole(role) {
  return (
    isValidRole(role) &&
    ADMINISTRATIVE_ROLE_SET.has(role.trim().toLowerCase())
  );
}

export function isVendorRole(role) {
  return normalizeRole(role) === ROLES.VENDOR;
}
