/**
 * ==========================================================
 * AV SILKS 2 ENTERPRISE RBAC CONSTITUTION
 * Version : 3.0
 * Status  : LOCKED FOUNDATION
 * ==========================================================
 * Single Source of Truth for every role,
 * permission, hierarchy and future expansion.
 * ==========================================================
 */

const ROLES = Object.freeze({

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

  DEMO: "demo"

});

const DEFAULT_ROLE = ROLES.CUSTOMER;

/**
 * Higher number = higher authority
 */
const ROLE_HIERARCHY = Object.freeze({

  owner: 100,

  super_admin: 90,

  admin: 80,

  auditor: 70,

  accountant: 65,

  inventory_manager: 60,

  marketing: 55,

  support: 50,

  vendor: 40,

  staff: 30,

  delivery_partner: 20,

  customer: 10,

  demo: 1

});

module.exports = {

  ROLES,

  DEFAULT_ROLE,

  ROLE_HIERARCHY

};
