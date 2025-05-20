import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaGithub } from "react-icons/fa";
import { useSelector } from "react-redux";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail, ChevronRight, LogIn } from "lucide-react";
import { Button } from "../ui/button";

const Footer = () => {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <footer className="bg-gray-950 text-gray-300 relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 to-transparent pointer-events-none"></div>
      
      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600"></div>
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-900/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-10 w-64 h-64 bg-purple-900/10 rounded-full filter blur-3xl"></div>
      
      {/* Main Footer Content */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12"
          >
            {/* Company Info */}
            <motion.div variants={itemVariants} className="lg:col-span-5">
              <div className="mb-6">
                <Link to="/" className="inline-block">
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Hire<span className="text-blue-500">Wave</span>
                  </h2>
                </Link>
                <p className="text-gray-400 max-w-md leading-relaxed mt-3">
                  Your trusted job portal connecting top talent with leading employers. Join the wave of success today and discover opportunities that match your skills and ambitions.
                </p>
              </div>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">123 Wave Street, San Francisco, CA 94107, United States</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-400">+1 (123) 456-7890</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <span className="text-gray-400">support@hirewave.com</span>
                </div>
              </div>
              
              <div className="mt-8 flex space-x-5">
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300"
                  aria-label="Facebook"
                >
                  <FaFacebook size={24} />
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300"
                  aria-label="Twitter"
                >
                  <FaTwitter size={24} />
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={24} />
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300"
                  aria-label="Instagram"
                >
                  <FaInstagram size={24} />
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-blue-400 transition-all duration-300"
                  aria-label="GitHub"
                >
                  <FaGithub size={24} />
                </a>
              </div>
            </motion.div>
            
            {/* Quick Links */}
            <motion.div variants={itemVariants} className={`lg:col-span-${(!user || user?.role === "student") ? "2" : "3"}`}>
              <h3 className="text-xl font-semibold text-white mb-6 relative">
                Quick Links
                <span className="absolute -bottom-2 left-0 w-10 h-1 bg-blue-600 rounded-full"></span>
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link to="/jobs" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Latest Jobs
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link to="/faqs" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    FAQs
                  </Link>
                </li>
              </ul>
            </motion.div>
            
            {/* For Job Seekers - Only show if not logged in as recruiter */}
            {(!user || user?.role === "student") && (
              <motion.div variants={itemVariants} className="lg:col-span-2">
                <h3 className="text-xl font-semibold text-white mb-6 relative">
                  For Job Seekers
                  <span className="absolute -bottom-2 left-0 w-10 h-1 bg-blue-600 rounded-full"></span>
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link to="/jobs" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      Browse Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/recommended-jobs" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      Recommended Jobs
                    </Link>
                  </li>
                  <li>
                    <Link to="/settings" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      Profile Settings
                    </Link>
                  </li>
                </ul>
              </motion.div>
            )}
            
            {/* For Employers - Only show if not logged in as student */}
            {(!user || user?.role === "recruiter") && (
              <motion.div variants={itemVariants} className="lg:col-span-3">
                <h3 className="text-xl font-semibold text-white mb-6 relative">
                  For Employers
                  <span className="absolute -bottom-2 left-0 w-10 h-1 bg-blue-600 rounded-full"></span>
                </h3>
                {user ? (
                  <ul className="space-y-3">
                    <li>
                      <Link to="/admin/jobs" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Post a Job
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/companies" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Manage Company
                      </Link>
                    </li>
                    <li>
                      <Link to="/admin/analytics" className="text-gray-400 hover:text-blue-400 transition-colors flex items-center gap-1.5 group">
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        Hiring Analytics
                      </Link>
                    </li>
                  </ul>
                ) : (
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-800">
                    <p className="text-gray-400 mb-4">Sign in to access employer features and start hiring top talent.</p>
                    <Button 
                      onClick={() => navigate('/login')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Sign In as Employer
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
      
      {/* Copyright Section */}
      <div className="border-t border-gray-800 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <motion.p 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-gray-500 text-sm"
            >
              &copy; {new Date().getFullYear()} HireWave. All rights reserved.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex gap-6 mt-4 md:mt-0"
            >
              <Link to="/privacy" className="text-gray-500 hover:text-gray-300 text-sm">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-500 hover:text-gray-300 text-sm">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-500 hover:text-gray-300 text-sm">
                Cookie Policy
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
