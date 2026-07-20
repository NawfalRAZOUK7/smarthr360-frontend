"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi, clearTokens, getAccessToken, storeTokens } from "./api";
import type { Tokens, User } from "./types";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string, otp?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

/** demo → HR; demo-admin / demo-manager / demo-employee → that role. */
const DEMO_ROLES: Record<string, string> = {
  demo: "HR",
  "demo-hr": "HR",
  "demo-admin": "ADMIN",
  "demo-manager": "MANAGER",
  "demo-employee": "EMPLOYEE",
  "demo-auditor": "AUDITOR",
  "demo-support": "SUPPORT",
};

/**
 * AUDITOR / SUPPORT are represented server-side as JWT groups rather than
 * the base role. Surface them as the effective UI role so the read-only
 * experience (nav, gates, badge) applies to real users, not just demos.
 */
function withEffectiveRole(u: User): User {
  const groups = u.groups ?? [];
  if (groups.includes("AUDITOR")) return { ...u, role: "AUDITOR" };
  if (groups.includes("SUPPORT")) return { ...u, role: "SUPPORT" };
  return u;
}

function demoUser(role: string): User {
  return {
    id: 0,
    email: "demo@smarthr360.dev",
    username: "demo",
    first_name: "Demo",
    last_name: role.charAt(0) + role.slice(1).toLowerCase(),
    role,
    email_verified_at: null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setLoading(false);
      return;
    }
    if (token === "demo") {
      const role = localStorage.getItem("shr360.demo-role") ?? "HR";
      setUser(demoUser(role));
      setLoading(false);
      return;
    }
    authApi<User>("/api/auth/me/")
      .then((u) => setUser(withEffectiveRole(u)))
      .catch(() => clearTokens())
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, otp?: string) => {
      const demoRole = DEMO_ROLES[identifier.toLowerCase()];
      if (demoRole && password === "demo") {
        storeTokens("demo", "demo");
        localStorage.setItem("shr360.demo-role", demoRole);
        setUser(demoUser(demoRole));
        return;
      }
      const isEmail = identifier.includes("@");
      const body: Record<string, string> = {
        [isEmail ? "email" : "username"]: identifier,
        password,
      };
      if (otp) body.otp = otp;
      const res = await authApi<{ user: User; tokens: Tokens }>(
        "/api/auth/login/",
        { method: "POST", body, auth: false }
      );
      storeTokens(res.tokens.access, res.tokens.refresh);
      setUser(withEffectiveRole(res.user));
    },
    []
  );

  const logout = useCallback(() => {
    clearTokens();
    setUser(null);
    window.location.href = "/login";
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
