export const fetchWithRefresh = async (url, options, setAuth, navigate) => {
    try {
        const resposne = await fetch(url, options)
        if(resposne.status === 401){
            const refreshResponse = await fetch(`${import.meta.env.API}/users/refresh`,{
            method: "POST",
            credentials: "include"
        })

        if(!refreshResponse.ok) throw new Error("Session Expired")

        const data = await refreshResponse.json()

        if(data.accessToken){
            setAuth(prev => ({...prev, accessToken: data.accessToken}))
            options.headers["Authorization"] = `Bearer ${data.accessToken}`
            return await fetch(url, options)
        } else{
            throw new Error("Could not refresh token")
        }
    }
    return resposne
    } catch (error) {
        setAuth({accessToken: null, user: null, role: null, message: "Session expired, please login again."})
        navigate("/login")
    }
} 