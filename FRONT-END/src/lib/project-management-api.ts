const configuredUrl =
  process.env.PROJECT_MANAGEMENT_API_URL ||
  process.env.NEXT_PUBLIC_PROJECT_MANAGEMENT_API_URL ||
  process.env.NEXT_PUBLIC_PROJECT_MANAGEMENT_URL;
export const PROJECT_MANAGEMENT_API_URL = (configuredUrl || "http://127.0.0.1:8000").replace(/\/$/, "");
export const PROJECT_MANAGEMENT_API_V1 = `${PROJECT_MANAGEMENT_API_URL}/api/v1`;

export async function projectManagementFetch(
  path: string,
  init: RequestInit = {},
) {
  return fetch(`${PROJECT_MANAGEMENT_API_V1}${path}`, {
    cache: "no-store",
    ...init,
    headers: {
      Accept: "application/json",
      ...init.headers,
    },
  });
}

export async function projectManagementGet(path:string) {
  const response=await projectManagementFetch(path);
  if(!response.ok){let message=`Project Management API returned ${response.status}.`;try{const body=await response.json();message=body.detail||body.error||message}catch{}throw new Error(message)}
  return response.json();
}
