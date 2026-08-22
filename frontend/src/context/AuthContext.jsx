import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

const extractUser = (data) => {
  return data?.user ?? data?.data?.user ?? data?.data ?? null;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // لو لا يوجد token، لا نحتاج Effect لتغيير الحالة أصلًا.
  const [initializing, setInitializing] = useState(() =>
    Boolean(localStorage.getItem("token"))
  );

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  const getMe = useCallback(async () => {
    const response = await api.get("/auth/me");
    const currentUser = extractUser(response.data);

    setUser(currentUser);

    return currentUser;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      return undefined;
    }

    let active = true;

    const loadUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const currentUser = extractUser(response.data);

        if (active) {
          setUser(currentUser);
        }
      } catch {
        if (active) {
          localStorage.removeItem("token");
          setUser(null);
        }
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    };

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  const authenticate = useCallback(
    async (endpoint, values) => {
      const response = await api.post(endpoint, values);

      const token =
        response.data?.token ??
        response.data?.data?.token ??
        response.data?.accessToken;

      if (token) {
        localStorage.setItem("token", token);
      }

      const currentUser = extractUser(response.data);

      if (currentUser) {
        setUser(currentUser);
      } else if (token) {
        await getMe();
      }

      return response.data;
    },
    [getMe]
  );

  const login = useCallback(
    (values) => authenticate("/auth/login", values),
    [authenticate]
  );

  const register = useCallback(
    (values) => authenticate("/auth/register", values),
    [authenticate]
  );

  const value = useMemo(
    () => ({
      user,
      initializing,
      isAuthenticated: Boolean(user),
      isAdmin: String(user?.role || "").toUpperCase() === "ADMIN",
      login,
      register,
      logout,
      getMe,
    }),
    [user, initializing, login, register, logout, getMe]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;