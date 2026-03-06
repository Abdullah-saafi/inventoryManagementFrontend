import API from "./api"

export const fetchWithRefresh = async (requestedFetch, setAuth, navigate) => {
    try {
        // Axios successfully gets the response
        const response = await requestedFetch()
        return response.data 
    } catch (error) {
        // Axios catches the 401 here
        if (error.response?.status === 401) {
            console.log("Token expired, attempting refresh...")
            
            try {
                // 1. Try to get a new token
                const refreshRes = await API.post("/users/refresh")
                const newToken = refreshRes.data.accessToken

                if (newToken) {
                    // 2. Update Context
                    setAuth(prev => ({ ...prev, accessToken: newToken }))
                    
                    // 3. Retry the original request
                    const retryResponse = await requestedFetch()
                    return retryResponse.data
                }
            } catch (refreshErr) {
                // Refresh failed (cookie expired or deleted)
                console.error("Refresh failed", refreshErr)
            }
        }

        // If we reach here, either it wasn't a 401, or the refresh failed
        setAuth({ accessToken: null, user: null, role: null, message: "Session expired." })
        navigate("/login")
        return null
    }
}