import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/authContext"

const ProtectedRoute = ({allowedRoles}) => {
    const {auth, loading} = useAuth()
    if(loading) return <div><h1>loading.............</h1></div>
    if(!auth.accessToken) return <Navigate to={"/login"} replace/>
    if(allowedRoles && !allowedRoles.includes(auth.role)){
        return <Navigate to={"unauthorized"} replace/>
    }
  return <Outlet/>
}

export default ProtectedRoute