import { createContext, useContext, useEffect, useState } from "react";
import { refreshToken } from "../services/api";

const AuthContext = createContext()

export const ContextProvider = ({children}) => {
    const [auth, setAuth] = useState({
        accessToken: null,
        user: null,
        role: null
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const restoreSession = async () => {
            try {
                const response = await refreshToken()
                const data = response.data
                if(data){
                    setAuth({
                        accessToken: data.accessToken,
                        username: data.username,
                        role: data.role
                    })
                }
            } catch (error) {
                if(error.response?.status !== 401 && error.response?.status !== 403 ){
                    console.log("Something wrong in context", error)
                }

            } finally{
                setLoading(false)
            }
        } 
        restoreSession()
    }, [])

    return(
        <AuthContext.Provider value={{auth, setAuth, loading}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)