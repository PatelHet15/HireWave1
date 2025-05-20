import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "./ui/button";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { Search, Briefcase, Star, ArrowRight, CheckCircle, BarChart, Clock } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

const HeroSection = () => {
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === "student";
  
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const bubbleVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0.5, delay: 0.6 },
    },
  };

  const featureCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: 0.3 + custom * 0.1 },
    }),
  };

  return (
    <div className="relative w-full min-h-[90vh] bg-gradient-to-b from-blue-900 via-blue-600 to- overflow-hidden">
      <motion.div
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="relative overflow-visible"
      >
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-20 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full py-16 px-4 sm:px-6 lg:px-8 relative z-10">
          {!user ? (
            // **Guest View (Before Login)**
            <>
              {/* Left: Content */}
              <motion.div
                variants={itemVariants}
                className="w-full md:w-1/2 space-y-8 md:pr-8"
              >
                <div className="space-y-6">
                  <motion.div
                    variants={itemVariants}
                    className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100"
                  >
                    <span className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 mr-1.5" fill="#fbbf24" />
                      <span className="text-blue-700 font-medium text-sm">The #1 Job Platform for Professionals</span>
                    </span>
                  </motion.div>

                  <motion.h1
                    variants={itemVariants}
                    className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight"
                  >
                    Find Your{" "}
                    <span className="relative inline-block">
                      Dream
                      <span className="absolute inset-x-0 bottom-0 h-3 bg-blue-200 opacity-50 -rotate-1"></span>
                    </span>{" "}
                    Job with{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-50">
                      HireWave
                    </span>
                  </motion.h1>

                  <motion.p
                    variants={itemVariants}
                    className="text-xl text-blue-100 max-w-xl leading-relaxed"
                  >
                    Connect with top companies, explore exciting opportunities, and take the next step in your career journey with personalized job matches.
                  </motion.p>
                </div>

                {/* Features Cards */}
                <motion.div
                  variants={itemVariants}
                  className="grid grid-cols-2 gap-4 my-8"
                >
                  <motion.div
                    custom={0}
                    variants={featureCardVariants}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Search className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Smart Search</h3>
                      <p className="text-sm text-blue-100">Find relevant jobs instantly</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    custom={1}
                    variants={featureCardVariants}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Briefcase className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Top Companies</h3>
                      <p className="text-sm text-blue-100">Work with the best</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    custom={2}
                    variants={featureCardVariants}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <BarChart className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Career Growth</h3>
                      <p className="text-sm text-blue-100">Track your progress</p>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    custom={3}
                    variants={featureCardVariants}
                    className="flex items-start space-x-3 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-200"
                  >
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Clock className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">Quick Apply</h3>
                      <p className="text-sm text-blue-100">One-click applications</p>
                    </div>
                  </motion.div>
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                  variants={itemVariants}
                  className="flex flex-col sm:flex-row gap-10 relative z-20"
                >
                  <Link to="/signup" className="w-full sm:w-auto">
                    <Button className="w-full bg-white hover:bg-gray-100 text-blue-600 px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-blue-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 group">
                      <span className="flex items-center">
                        Get Started Now
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link to="/browse" className="w-full sm:w-auto">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 border-2 border-white text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-900/20">
                      Browse Jobs
                    </Button>
                  </Link>
                </motion.div>

                {/* Trust badges */}
                <motion.div
                  variants={itemVariants}
                  className="flex items-center gap-2 text-sm text-blue-100 mt-6"
                >
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-black">Trusted by 5K+ companies worldwide</span>
                </motion.div>
              </motion.div>
              {/* Right: Animation */}
              <motion.div
                variants={itemVariants}
                className="w-full md:w-1/2 flex justify-center items-center mt-12 md:mt-0"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-600 blur-3xl opacity-5 rounded-full"></div>
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                  >
                    <DotLottieReact
                      className="w-[340px] h-[340px] sm:w-[440px] sm:h-[440px] lg:w-[540px] lg:h-[540px]"
                      src="https://lottie.host/e349a17c-8f2f-4e89-acce-649ac80d300a/J9WvRxlFyW.lottie"
                      loop
                      autoplay
                    />
                  </motion.div>
                  
                  {/* Floating elements */}
                  <motion.div 
                    initial={{ x: -10, y: -10, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="absolute top-1/4 -left-10 bg-white p-3 rounded-lg shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="font-medium text-gray-800">Resume Uploaded</span>
                    </div>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ x: 10, y: 10, opacity: 0 }}
                    animate={{ x: 0, y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="absolute bottom-1/4 -right-6 bg-white p-3 rounded-lg shadow-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" fill="#fbbf24" />
                      <span className="font-medium text-gray-800">Job Matched!</span>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </>
          ) : isStudent ? (
            // **Student View (After Login)**
            <motion.div 
              variants={itemVariants}
              className="text-center w-full max-w-4xl py-5 mx-auto"
            >
              <div className="flex flex-col gap-6">
                <motion.span 
                  variants={itemVariants}
                  className="px-5 py-2.5 rounded-full text-xl font-bold bg-blue-50 text-blue-600 inline-block mx-auto"
                >
                  The <span className="text-blue-700">#1</span> Hiring Platform for{" "}
                  <span className="text-blue-700">Talent</span> &{" "}
                  <span className="text-blue-700">Opportunities</span>
                </motion.span>
                
                <motion.h1 
                  variants={itemVariants}
                  className="text-5xl sm:text-6xl font-bold text-white"
                >
                  Search, Apply & <br />
                  Get your
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-50"> Dream Jobs</span>
                </motion.h1>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-xl text-blue-100 my-6 max-w-3xl mx-auto"
                >
                  Discover the best opportunities tailored for you. We've analyzed your profile and 
                  found <span className="font-semibold text-white">28 new jobs</span> that match your skills and preferences.
                </motion.p>
                
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap justify-center gap-4 mt-14 relative z-20"
                >
                  <Link to="/jobs">
                  <Button className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-blue-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 group">
                      <span className="flex items-center">
                        Browse Latest Jobs
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link to="/candidate/dashboard">
                    <Button className="bg-blue-500 hover:bg-blue-600 border-2 border-white text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-900/20">
                      View Your Dashboard
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            // **Recruiter View (After Login)**
            <motion.div 
              variants={itemVariants}
              className="text-center w-full max-w-4xl py-5 mx-auto"
            >
              <div className="flex flex-col gap-6">
                <motion.span 
                  variants={itemVariants}
                  className="px-5 py-2.5 rounded-full text-xl font-bold bg-blue-50 text-blue-600 inline-block mx-auto"
                >
                  The <span className="text-blue-700">#1</span> Platform for{" "}
                  <span className="text-blue-700">Talent Acquisition</span> &{" "}
                  <span className="text-blue-700">Recruitment</span>
                </motion.span>
                
                <motion.h1 
                  variants={itemVariants}
                  className="text-5xl sm:text-6xl font-bold text-white"
                >
                  Search, Hire & <br />
                  Find your <span className="relative">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-blue-50">Perfect Talent</span>
                    <span className="absolute inset-x-0 bottom-0 h-3 bg-blue-200 opacity-50 -rotate-1"></span>
                  </span>
                </motion.h1>
                
                <motion.p 
                  variants={itemVariants}
                  className="text-xl text-blue-100 my-6 max-w-3xl mx-auto"
                >
                  Discover the best talent for your company. Access our pool of qualified candidates 
                  and streamline your recruitment process with our comprehensive hiring tools.
                </motion.p>
                
                <motion.div
                  variants={itemVariants}
                  className="flex flex-wrap justify-center gap-4 mt-4 relative z-20"
                >
                  <Link to="/admin/jobs">
                    <Button className="bg-white hover:bg-gray-100 text-blue-600 px-8 py-6 rounded-xl text-lg font-semibold shadow-lg shadow-blue-900/20 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/30 group">
                      <span className="flex items-center">
                        Manage Job Postings
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </Button>
                  </Link>
                  <Link to="/admin/analytics">
                    <Button className="bg-blue-500 hover:bg-blue-600 border-2 border-white text-white px-8 py-6 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg shadow-blue-900/20">
                      Review Analytics
                    </Button>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
      
      {/* Curved edge for transition to next section */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path fill="#f8fafc" fillOpacity="1" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,154.7C960,171,1056,181,1152,165.3C1248,149,1344,107,1392,85.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection;