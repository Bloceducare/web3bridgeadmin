"use client"; // Mark this component as client-side

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { EyeOff } from "lucide-react";
import { Eye } from "lucide-react";
import Logo from "../../../../public/web3bridgeDark.svg"
import Image from "next/image";
import { ScaleLoader } from "react-spinners";

type FormData = {
    username: string;
    password: string;
};
  
type User = {
    email: string;
    id: number;
    username: string;
    github_username: string;
    role: string;
};
  type FormErrors = {
    [key in keyof FormData]?: string[];
};
  const initialFormState: FormData = {
    username: "",
    password: "",
};

  const initialFormErrors: FormErrors = {};

const Login = () => {

    const [formData, setFormData] = useState<FormData>(initialFormState);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
    const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setErrors({
      ...errors,
      [name]: undefined,
    });
  };

  // Function to handle login
  const handleLogin =async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors(initialFormErrors);

    const formDataToSend = {
      ...formData,
    };

    console.log(formDataToSend)

    try {
    console.log(formDataToSend)
        const response = await axios.post("https://web3bridgeauth-y4kb.onrender.com/accounts/signin", formDataToSend)

        const data = response.data
        console.log(data)
        if (response.data) {
          localStorage.setItem("token", data.access_token);
          localStorage.setItem("user", JSON.stringify(data.user));
            setFormData(initialFormState);
              window.location.href = "/Web3Lagos/Dashboard"
        } else {
            setErrors(data);
            setMessage("Please check your details  and try again.");
            setLoading(false)
        }
        
    } catch (error) {
        setLoading(false)
        setMessage("There is an issue with the network. Please try again")
    }
  }

  return (
    <div className="w-full overflow-hidden h-full p-4 ">
        <div className="flex justify-start">
          <Image src={Logo} alt="Web3Bridge Logo" />
        </div>

        <section className="flex justify-center mt-10">

        <div className="border shadow-xl w-4/5 flex  flex-col space-y-20 p-10 rounded-xl"> 
        <div className="space-y-5">
        <h2 className="text-4xl">Login</h2>

          <p>Access your dashboard as an admin</p>
        </div>

        



        <form onSubmit={handleLogin} className="flex flex-col gap-14  text-xl">
          <div className="flex flex-col gap-10  text-xl">
          <div className="flex flex-col gap-2">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={handleChange}
            name="username"
            placeholder="Enter your username"
            className="p-2 border outline-none"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password">Password</label>
          <div className="flex border justify-between p-2">
          <input
                  type={showPassword ? "text" : "password"}
                  id="twitter"
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter your password."
                  value={formData.password}
                  required
                  className="outline-none"
                />
                 <div
                  className=" right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </div>
          </div>

        </div>

          </div>

          <div className="space-y-5 flex flex-col ">
      
        <button className="border p-5 rounded-full bg-[#181A1C] text-white"
                type="submit"
                disabled={loading}
              >
                {loading ? <ScaleLoader color="#ffff" /> : "LogIn"}
              </button>
              <div className="flex justify-center">
              {message ? <p>{message}</p> : "" }
              </div>
              </div>
      </form>



        </div>
        </section>
    
    </div>
  );
};

export default Login;
