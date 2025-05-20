import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../shared/Navbar";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { RadioGroup } from "../ui/radio-group";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/Redux/authSlice";
import { Loader2, Mail, Lock } from "lucide-react";
import Footer from "../shared/Footer";

const Login = () => {
  const [input, setInput] = useState({ email: "", password: "", role: "" });
  const { loading, user } = useSelector((store) => store.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      dispatch(setLoading(true));
  
      const res = await axios.post(`${USER_API_END_POINT}/login`, input, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });
  
      if (res.data.success) {
        // Store user data
        localStorage.setItem('user', JSON.stringify({
          _id: res.data.user._id,
          role: res.data.user.role,
          email: res.data.user.email
        }));
        
        // Store token in localStorage
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        
        // Update Redux state
        dispatch(setUser(res.data.user));
        
        // Redirect to home page
        navigate("/");
        toast.success(res.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <motion.div
        className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900">Welcome Back</h1>
            <p className="mt-2 text-sm text-gray-600">
              Please sign in to your account
            </p>
          </div>
          <form
            onSubmit={submitHandler}
            className="bg-white rounded-xl shadow-lg p-8 space-y-6"
          >
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="email"
                  value={input.email}
                  name="email"
                  onChange={changeEventHandler}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  className="pl-10 w-full border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="password"
                  value={input.password}
                  name="password"
                  onChange={changeEventHandler}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Select Role</Label>
              <RadioGroup className="flex items-center gap-6 mt-2">
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="student"
                    checked={input.role === "student"}
                    onChange={changeEventHandler}
                    className="w-4 h-4 cursor-pointer text-blue-600 focus:ring-blue-500"
                  />
                  <Label className="text-sm text-gray-700">Student</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="radio"
                    name="role"
                    value="recruiter"
                    checked={input.role === "recruiter"}
                    onChange={changeEventHandler}
                    className="w-4 h-4 cursor-pointer text-blue-600 focus:ring-blue-500"
                  />
                  <Label className="text-sm text-gray-700">Recruiter</Label>
                </div>
              </RadioGroup>
            </div>
            {loading ? (
              <Button disabled className="w-full py-2.5 bg-blue-600 text-white rounded-lg opacity-75 transition-all duration-200">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Please Wait...
              </Button>
            ) : (
              <Button 
                type="submit" 
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
              >
                Login
              </Button>
            )}
            <p className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default Login;
