import { isValidRole, normalizeRole } from "../constants/roles";
import { getApiBaseUrl } from "./api";

function createSessionError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export async function fetchTrustedAuthSession(
  user,
  { fetchImpl = fetch } = {}
) {
  const uid =
    typeof user?.uid === "string"
      ? user.uid.trim()
      : "";

  if (
    !uid ||
    typeof user?.getIdToken !== "function"
  ) {
    throw createSessionError(
      "AUTHENTICATION_REQUIRED",
      "Authentication is required."
    );
  }

  if (typeof fetchImpl !== "function") {
    throw new TypeError(
      "Trusted auth fetch dependency must be a function."
    );
  }

  const idToken = await user.getIdToken();

  const response = await fetchImpl(
    `${getApiBaseUrl()}/auth/me`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    }
  );

  let result = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (
    !response.ok ||
    result?.success !== true
  ) {
    throw createSessionError(
      result?.code || "TRUSTED_SESSION_REQUEST_FAILED",
      "Trusted authentication session could not be verified."
    );
  }

  const sessionUid =
    typeof result?.data?.uid === "string"
      ? result.data.uid.trim()
      : "";

  const sessionRole = result?.data?.role;

  if (
    !sessionUid ||
    sessionUid !== uid ||
    !isValidRole(sessionRole)
  ) {
    throw createSessionError(
      "INVALID_TRUSTED_SESSION",
      "Trusted authentication session is invalid."
    );
  }

  return Object.freeze({
    uid: sessionUid,
    role: normalizeRole(sessionRole)
  });
}
