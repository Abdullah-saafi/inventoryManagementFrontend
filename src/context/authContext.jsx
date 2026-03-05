import { createContext, useContext, useState } from "react";

const AuthContext = createContext()

export const contextProvider = ({children}) => {
    const [auth, setAuth] = useState({
        accessToken: null,
        user: null,
        role: null
    })

    return(
        <AuthContext.Provider value={{auth, setAuth}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)