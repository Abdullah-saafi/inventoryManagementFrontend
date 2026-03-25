import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const useErrorHandler = () => {
    const navigate = useNavigate()
    const {setAuth} = useAuth()
    
    const handleError = (error, customMessage) => {
        const errorMsg = error.response?.data?.message || "Server Error"
        
        if(error.response?.status === 400 || error.response?.status === 401){
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
        } else if (error.response?.status === 403 && errorMsg.includes("inactive") || error.response?.status === 400 && errorMsg.includes("inactive") ){
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