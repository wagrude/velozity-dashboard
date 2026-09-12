import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { setAccessToken } from "../api/client";
import {
  getMe,
  login as loginApi,
  logout as logoutApi,
  refreshAccessToken,
} from "../api/auth";
import {
  connectSocket,
  disconnectSocket,
} from "../api/socket";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const accessToken = await refreshAccessToken();

        setAccessToken(accessToken);
        connectSocket(accessToken);

        const currentUser = await getMe();
        setUser(currentUser);
      } catch {
        disconnectSocket();
        setAccessToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email: string, password: string) {
    const data = await loginApi(email, password);

    setUser(data.user);
    setAccessToken(data.accessToken);
    connectSocket(data.accessToken);
  }

  async function logout() {
    try {
      await logoutApi();
    } finally {
      disconnectSocket();
      setAccessToken(null);
      setUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider",
    );
  }

  return context;
}
