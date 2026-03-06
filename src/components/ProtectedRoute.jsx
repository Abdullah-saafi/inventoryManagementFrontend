import { useAuth } from "../context/authContext"

const ProtectedRoute = () => {
    const [auth, setAuth] = useAuth()
    if(!auth.accessToken) return 
  return (
    <div>ProtectedRoute</div>
  )
}

export default ProtectedRoute