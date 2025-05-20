import React, { useState, useEffect } from "react";
import Navbar from "../shared/Navbar";
import { Label } from "@radix-ui/react-label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { toast } from "sonner";
import { useDispatch, useSelector } from "react-redux";
import { setLoading, setUser } from "@/Redux/authSlice";
import { Loader2, CheckCircle, GraduationCap, Briefcase } from "lucide-react";
import logo from "../../assets/images/Work in progress-rafiki.svg";
import { motion } from "framer-motion";
import Footer from "../shared/Footer";

const Signup = () => {
  const [input, setInput] = useState({
    fullname: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "",
    file: "",
  });

  const { loading, user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const changeEventHandler = (e) => {
    setInput({ ...input, [e.target.name]: e.target.value });
  };

  const changeFileHandler = (e) => {
    setInput({ ...input, file: e.target.files?.[0] });
  };

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  // ✅ Signup Handler Function
  const signupHandler = async (e) => {
    e.preventDefault();
    dispatch(setLoading(true));

    try {
      const formData = new FormData();
      formData.append("fullname", input.fullname);
      formData.append("email", input.email);
      formData.append("phoneNumber", input.phoneNumber);
      formData.append("password", input.password);
      formData.append("role", input.role);
      formData.append("file", input.file);

      const { data } = await axios.post(`${USER_API_END_POINT}/register`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials:true,
      });

      toast.success("Signup Successful! Redirecting...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup Failed!");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const Feature = ({ text }) => (
    <div className="flex items-center gap-2 text-gray-700">
      <CheckCircle className="text-green-500" size={20} />
      <span className="text-sm">{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex justify-center max-w-6xl mx-auto gap-10 py-10">
        {/* Informative Card */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-1/3 bg-white p-6 rounded-lg shadow-md text-center sticky top-20"
        >
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Job Hunt" className="w-72 h-72 object-cover" />
          </div>
          <h2 className="font-bold text-xl text-gray-800">
            Why Join <span className="text-blue-700">HireWave?</span>
          </h2>
          <div className="mt-4 space-y-3 text-left">
            <Feature text="Build your profile and let recruiters find you" />
            <Feature text="Get job postings delivered right to your email" />
            <Feature text="Find a job and grow your career" />
          </div>
        </motion.div>

        {/* Signup Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="w-2/3 rounded-lg p-6 shadow-lg bg-white"
        >
          <form onSubmit={signupHandler} className="space-y-4">
            <h1 className="font-semibold text-2xl text-gray-700 text-center">
              Create Your <span className="text-blue-700">HireWave</span> Account
            </h1>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  className="border-gray-300"
                  type="text"
                  name="fullname"
                  onChange={changeEventHandler}
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  className="border-gray-300"
                  type="text"
                  name="email"
                  onChange={changeEventHandler}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone No.</Label>
                <Input
                  className="border-gray-300"
                  type="text"
                  name="phoneNumber"
                  onChange={changeEventHandler}
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <Label>Password</Label>
                <Input
                  className="border-gray-300"
                  type="password"
                  name="password"
                  onChange={changeEventHandler}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <div className="flex gap-6 mt-2">
                <div
                  className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    input.role === "student"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setInput({ ...input, role: "student" })}
                >
                  <GraduationCap className="text-blue-500" size={24} />
                  <span className="mt-2 text-sm">Student</span>
                </div>
                <div
                  className={`flex flex-col items-center p-4 border rounded-lg cursor-pointer transition-all ${
                    input.role === "recruiter"
                      ? "border-green-500 bg-green-50"
                      : "border-gray-300"
                  }`}
                  onClick={() => setInput({ ...input, role: "recruiter" })}
                >
                  <Briefcase className="text-green-500" size={24} />
                  <span className="mt-2 text-sm">Recruiter</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full bg-blue-800 text-lg py-3 rounded-lg hover:bg-blue-900 transition-all"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
              </Button>
            </div>

            <div className="text-center">
              <span className="text-sm">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-900 hover:underline">
                  Login
                </Link>
              </span>
            </div>
          </form>
        </motion.div>
      </div>
      <div className="mt-5">
        <Footer/>
      </div>
    </div>
  );
};

export default Signup;
