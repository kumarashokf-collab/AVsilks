import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const rolesSource = fs.readFileSync(
  new URL("../src/constants/roles.js", import.meta.url),
  "utf8"
);

const appSource = fs.readFileSync(
  new URL("../src/App.jsx", import.meta.url),
  "utf8"
);

const navbarSource = fs.readFileSync(
  new URL("../src/components/Navbar.jsx", import.meta.url),
  "utf8"
);

const orderContextSource = fs.readFileSync(
  new URL("../src/context/OrderContext.jsx", import.meta.url),
  "utf8"
);

const canonicalRoles = [
  "owner",
  "super_admin",
  "admin",
  "vendor",
  "staff",
  "customer",
  "delivery_partner",
  "support",
  "auditor",
  "accountant",
  "marketing",
  "inventory_manager",
  "demo",
];

test("frontend trusted role contract contains every canonical backend role", () => {
  for (const role of canonicalRoles) {
    assert.match(
      rolesSource,
      new RegExp(`["']${role}["']`),
      `missing frontend trusted role: ${role}`
    );
  }
});

test("frontend centralizes full administrative access for owner super_admin and admin", () => {
  assert.match(rolesSource, /isAdministrativeRole/);
  assert.match(rolesSource, /ROLES\.OWNER/);
  assert.match(rolesSource, /ROLES\.SUPER_ADMIN/);
  assert.match(rolesSource, /ROLES\.ADMIN/);
});

test("admin-facing frontend boundaries use the centralized administrative role helper", () => {
  assert.match(appSource, /isAdministrativeRole/);
  assert.match(navbarSource, /isAdministrativeRole/);
  assert.match(orderContextSource, /isAdministrativeRole/);
});

console.log("TRUSTED_ROLE_BOUNDARY_RED_TEST_SETUP=PASS");
