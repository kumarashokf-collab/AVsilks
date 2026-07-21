# AVsilks Changelog

All notable changes to this project will be documented here.

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
