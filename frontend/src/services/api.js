export function getApiBaseUrl() {
  const environment =
    import.meta.env ?? {};

  const configuredBaseUrl =
    environment.PROD === true
      ? "/api"
      : (
          environment.VITE_API_BASE_URL ||
          "/api"
        );

  return String(
    configuredBaseUrl
  )
    .trim()
    .replace(
      /\/+$/,
      ""
    );
}
