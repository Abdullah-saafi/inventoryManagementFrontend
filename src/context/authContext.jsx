import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken } from "../services/api";

const AuthContext = createContext();

export const ContextProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    accessToken: null,
    username: null,
    role: null,
    storeName: null,
    store_id: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await refreshToken();
        const data = response.data;
        if (data) {
          setAuth({
            accessToken: data.accessToken,
            username: data.username,
            role: data.role,
            storeName: data.storeName,
            store_id: data.storeId,
          });
        }
      } catch (error) {
        if (error.response?.status !== 401 && error.response?.status !== 403) {
          console.log("Something wrong in context", error);
        }
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  // Use a div wrapper instead of nothing — avoids React's <p> nesting warning
  // that occurs when this Provider is rendered inside a <p> element upstream
  return (
    <AuthContext.Provider value={{ auth, setAuth, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
