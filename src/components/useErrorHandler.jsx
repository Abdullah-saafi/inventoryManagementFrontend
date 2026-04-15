import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const useErrorHandler = () => {
    const navigate = useNavigate()
    const {setAuth} = useAuth()
    
    const handleError = (error, customMessage) => {
        const errorMsg = error.response?.data?.message || "Server Error"
        
        const status = error.response?.status
        if(status === 401){
            return errorMsg
        } else if(status === 400 && errorMsg.includes("Session") || status === 401 && errorMsg.includes("Invalid" || "expired")){
            setAuth({
                accessToken: null,
                username: null,
                role: null,
                storeName: null,
                store_id: null,
                message: errorMsg
            })
            navigate("/login")
            return errorMsg
        } else if (status === 403 && errorMsg.includes("inactive") || status === 400 && errorMsg.includes("inactive") ){
            setAuth(prev => ({...prev, isBlocked: true, message: errorMsg}))
            return errorMsg
        }
        else{
            console.log(customMessage, error)
            return error.response?.data.message || customMessage
        }
    }
  return handleError
}

export default useErrorHandler