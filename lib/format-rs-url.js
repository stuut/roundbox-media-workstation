export function formatR2Url(databaseUrl){
  if (!databaseUrl) return "";

  // Replaces the public r2 endpoint domain with your local proxy path
  return databaseUrl.replace(
    "https://pub-d6323aeb43a84ab4a229b45727a1e7ee.r2.dev",
    "/r2-assets"
  );
}
