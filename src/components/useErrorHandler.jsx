import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const useErrorHandler = () => {
    const navigate = useNavigate()
    const {setAuth} = useAuth()
    
    const handleError = (error, customMessage) => {
        if(error.response?.status === 400){
            const errorMsg = error.response?.data?.message || "Server Error"
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
        }
         else{
            console.log(customMessage, error)
            return error.response?.data.message || customMessage
        }
    }
  return handleError
}

export default useErrorHandler