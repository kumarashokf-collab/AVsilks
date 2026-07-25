'use strict';

/**
 * AV Silks 2 Backend RBAC Roles
 * Status: Active development
 *
 * Role hierarchy is descriptive metadata only.
 * Authorization decisions must use explicit permissions.
 */

const ROLES = Object.freeze({
  OWNER: 'owner',
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  VENDOR: 'vendor',
  STAFF: 'staff',
  CUSTOMER: 'customer',
  DELIVERY_PARTNER: 'delivery_partner',
  SUPPORT: 'support',
  AUDITOR: 'auditor',
  ACCOUNTANT: 'accountant',
  MARKETING: 'marketing',
  INVENTORY_MANAGER: 'inventory_manager',
  DEMO: 'demo',
});

const DEFAULT_ROLE = ROLES.CUSTOMER;
const VALID_ROLES = Object.freeze(Object.values(ROLES));
const VALID_ROLE_SET = new Set(VALID_ROLES);

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.OWNER]: 100,
  [ROLES.SUPER_ADMIN]: 90,
  [ROLES.ADMIN]: 80,
  [ROLES.AUDITOR]: 70,
  [ROLES.ACCOUNTANT]: 65,
  [ROLES.INVENTORY_MANAGER]: 60,
  [ROLES.MARKETING]: 55,
  [ROLES.SUPPORT]: 50,
  [ROLES.VENDOR]: 40,
  [ROLES.STAFF]: 30,
  [ROLES.DELIVERY_PARTNER]: 20,
  [ROLES.CUSTOMER]: 10,
  [ROLES.DEMO]: 1,
});

function normalizeRole(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
}

function isValidRole(value) {
  return VALID_ROLE_SET.has(normalizeRole(value));
}

module.exports = {
  ROLES,
  DEFAULT_ROLE,
  VALID_ROLES,
  ROLE_HIERARCHY,
  normalizeRole,
  isValidRole,
};
