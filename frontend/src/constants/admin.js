export const ADMIN_PHONE = "+919999990001";

export function isAdminUser(user) {
  return Boolean(
    user?.phoneNumber &&
    user.phoneNumber === ADMIN_PHONE
  );
}
