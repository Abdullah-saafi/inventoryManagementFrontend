import { useState } from "react"
import { addUser } from "../services/api"

const AddUser = () => {
    const [form, setForm] = useState({
        username: "",
        email: "",
        branchName: "",
        password: "",
        confirmPassword: ""
    })
    const [message, setMessage] = useState("")
    const [loading, setLoading] = useState(false)

    const handleChange = (e)=>{
        setForm({...form,[e.target.name]: e.target.value})
    }

    const handleSubmit = async (e)=>{
        e.preventDefault()
        setLoading(true)
        
        try {
            const response = await addUser(form)
            const data = response.data
            setMessage(data.message)
        } catch (error) {
            console.log("Error in add user catch",error)
        } finally{
            setLoading(false)
        }
    }

  return (
      <div>
        <h1>Add Lab Staff</h1>
        <form onSubmit={handleSubmit}>

            <div className="form-group">
                <label>Username</label>
                <input name="username" placeholder="Enter Username" onChange={handleChange}/>
            </div>

            <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="Enter Email" onChange={handleChange}/>
            </div>

            <div className="form-group">
                <label>Branch Name</label>
                <input name="branchName" placeholder="Enter Branch Name" onChange={handleChange}/>
            </div>
            
            <div className="form-group">
                <label>Password</label>
                <input name="password" placeholder="Enter Password" onChange={handleChange}/>
            </div>

            <div className="form-group">
                <label>Confirm Password</label>
                <input name="confirmPassword" placeholder="Enter Password" onChange={handleChange}/>
            </div>

            <button className="submit-btn" disabled={loading}>{loading? <span className="spinner"></span> : "Create"}</button>
        {message && <p className={messageType === "success"? "success" : "error"}>{message}</p>}
        </form>
    </div>
  )
}

export default AddUser