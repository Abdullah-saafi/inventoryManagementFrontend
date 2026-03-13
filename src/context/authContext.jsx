import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken, setAccessTokenInApi } from "../services/api";

const AuthContext = createContext()

export const ContextProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        accessToken: null,
        username: null,
        role: null,
        storeName: null,
        store_id: null,
        message: null
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setAccessTokenInApi(auth.accessToken);
    }, [auth.accessToken]);

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await refreshToken()
                const data = response.data
                if (data?.accessToken) {
                    setAuth({
                        accessToken: data.accessToken,
                        username: data.username,
                        role: data.role,
                        storeName: data.storeName,
                        store_id: data.storeId
                    })
                }
            } catch (error) {
                if (error.response?.status === 401) {
                    return;
                }
                console.log("Unexpected error in auth context");
                

            } finally {
                setLoading(false)
            }
        }
        restoreSession()
    }, [])

    return (
        <AuthContext.Provider value={{ auth, setAuth, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)