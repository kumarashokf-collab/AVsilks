export function getApiBaseUrl() {
  const configuredBaseUrl = import.meta.env.PROD
    ? "/api"
    : (import.meta.env.VITE_API_BASE_URL || "/api");

  return String(configuredBaseUrl)
    .trim()
    .replace(/\/+$/, "");
}
