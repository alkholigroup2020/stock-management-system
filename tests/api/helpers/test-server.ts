/**
 * Test Server Utilities
 *
 * Provides utilities for making authenticated API requests during tests
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

export interface TestUser {
  id: string;
  username: string;
  email: string;
  role: "ADMIN" | "SUPERVISOR" | "OPERATOR";
  cookie?: string;
}

/**
 * Login and get authentication cookie
 */
export async function loginUser(username: string, password: string): Promise<TestUser> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email: username, password }),
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  // Get session cookie from response
  const setCookie = response.headers.get("set-cookie");
  const cookie = setCookie || "";

  const data = await response.json();

  return {
    id: data.user.id,
    username: data.user.username,
    email: data.user.email,
    role: data.user.role,
    cookie,
  };
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch<T = unknown>(
  path: string,
  options: RequestInit & { user: TestUser }
): Promise<{ data?: T; error?: unknown; status: number }> {
  const { user, ...fetchOptions } = options;

  const headers = new Headers(fetchOptions.headers);
  if (user.cookie) {
    headers.set("Cookie", user.cookie);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  const status = response.status;

  try {
    const data = await response.json();

    if (!response.ok) {
      return { error: data, status };
    }

    return { data: data as T, status };
  } catch (error) {
    return { error, status };
  }
}

/**
 * Make an unauthenticated API request
 */
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ data?: T; error?: unknown; status: number }> {
  const response = await fetch(`${BASE_URL}${path}`, options);

  const status = response.status;

  try {
    const data = await response.json();

    if (!response.ok) {
      return { error: data, status };
    }

    return { data: data as T, status };
  } catch (error) {
    return { error, status };
  }
}
