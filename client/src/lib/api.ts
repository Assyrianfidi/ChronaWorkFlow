// API utility with authentication support
export async function apiRequest(
  method: string,
  url: string,
  data?: any
): Promise<Response> {
  const token = localStorage.getItem("auth_token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === "POST" || method === "PATCH" || method === "PUT")) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(url, options);

  if (response.status === 401) {
    // Unauthorized - clear auth and redirect to login
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    window.location.href = "/login";
  }

  return response;
}

// Helper to get the current company ID
export function getCurrentCompanyId(): string {
  const storedUser = localStorage.getItem("auth_user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return user.currentCompanyId || "";
  }
  return "";
}
