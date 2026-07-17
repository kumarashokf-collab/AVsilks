export const ADMIN_PHONES = [
  "+917729911578",
  "+919999999991"
];

export function isAdminUser(user) {
  return Boolean(
    user?.phoneNumber &&
    ADMIN_PHONES.includes(user.phoneNumber)
  );
}
