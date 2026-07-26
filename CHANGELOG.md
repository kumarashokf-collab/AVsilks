# AVsilks Changelog

All notable changes to this project will be documented here.

## Unreleased

### Security
- Completed Phase 0 Security Recovery Gate.
- Rotated Razorpay Test API Keys.
- Rotated Firebase Service Account credentials.
- Removed old Firebase service account keys.
- Removed old Razorpay API key exports.
- Verified repository with Gitleaks (no leaks found).
- Hardened verifyAuth middleware with revoked-token validation, role extraction, and minimal req.user.

### Backend RBAC Foundation
#### Added
- Added centralized backend role and permission catalogues.
- Added role-to-permission mappings for 13 application roles.
- Added reusable `verifyRole` and `requirePermission` middleware.
- Added startup-time RBAC configuration validation.
- Protected `POST /api/products` with authentication and `products.create` permission.
- Added automated RBAC tests using the built-in Node.js test runner.
- Added permanent `npm test` command for backend tests.
- Added structured authorization-denial audit logging without tokens or personal data.
- Hardened authenticated role resolution with role validation, Firestore precedence, and fail-closed customer fallback.

#### Verified
- RBAC configuration validation ✅
- JavaScript syntax sweep ✅
- Git diff and conflict-marker integrity check ✅
- Missing-token HTTP response: 401 ✅
- Invalid-token HTTP response: 401 ✅
- Public product GET regression response: 200 ✅
- Role-permission authorization matrix ✅
- Automated RBAC tests: 17/17 PASS ✅
- Focused RBAC source secret scan ✅
- Authorization audit logging privacy check ✅
- verifyAuth bearer-token and trusted-role helper tests ✅
- Firestore role precedence and fail-closed fallback tests ✅

## v0.7.5 - RBAC Foundation
Date: 2026-07-21

### Changed
- Centralized frontend admin detection using `isAdminUser()`.
- Removed duplicate admin phone lists.
- Kept admin phone numbers only in `src/constants/admin.js`.
- Updated Navbar and Login to use the centralized helper.

### Verified
- Build ✅
- Preview Deploy ✅
- Admin Login Redirect Live Test ✅
- Admin Panel Visibility Live Test ✅
- Secret Scan ✅
- Git Feature Branch Commit ✅
- Git Feature Branch Push ✅

---

## v0.7.4 - Checkout Validation
Date: 2026-07-20

### Added
- Validated checkout items against the latest live product data.
- Blocked missing, inactive, out-of-stock, and over-quantity products.
- Recalculated subtotal, shipping, and total using the latest product price.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Valid-order live test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.3 - Cart Stock Safety
Date: 2026-07-19

### Added
- Prevented out-of-stock products from being added to the cart.
- Limited first-time cart quantity to available stock.
- Preserved existing quantity merge behavior.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Live Test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.2 - Search Debounce
Date: 2026-07-19

### Added
- Added 300ms debounce for Home search.
- Added 300ms debounce for Products search.

### Verified
- Audit ✅
- Build ✅
- Deploy ✅
- Live Test ✅
- Secret Scan ✅
- Git Feature Branch ✅

---

## v0.7.1 - Order Date Formatting

### Fixed
- Fixed My Orders date & time formatting.
- Fixed Order Details date & time formatting.

---

## v0.6.2 - Firebase Bundle Optimization

### Changed
- Removed unused Firebase Storage.
- Removed unused Firebase Messaging.
- Reduced frontend Firebase initialization complexity.
