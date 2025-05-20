import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@radix-ui/react-popover";
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Avatar, AvatarImage } from "../ui/avatar";
import { LogOut, Settings, HelpCircle, Sparkles, Clock, Dot, ArrowRight, ChevronDown, ChevronUp, Bell, BellIcon, MapPin, ListFilter, Briefcase, Building2, Users, BarChart, LayoutDashboard, Search, X, User, Menu, InfoIcon, MessageSquare } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import axios from "axios";
import { USER_API_END_POINT } from "@/utils/constant";
import { setUser } from "@/Redux/authSlice";
import { motion } from "framer-motion";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import logo from "../../assets/images/user.jpg";
import logo2 from "../../assets/images/logo2.png";

const Navbar = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState("new"); // new | previous
  const [expandedNotifications, setExpandedNotifications] = useState({});
  const popoverOpen = useRef(false);
  const [hasViewedAllNotifications, setHasViewedAllNotifications] = useState(false);
  const [browseDropdownOpen, setBrowseDropdownOpen] = useState(false);

  // Reset hasViewedAllNotifications when new notifications arrive
  useEffect(() => {
    if (user?.notifications?.some(n => !n.isRead)) {
      setHasViewedAllNotifications(false);
    }
  }, [user?.notifications]);

  const getImageUrl = (url) => {
    // Handle null, undefined, or empty strings
    if (!url || url === '') {
      return null;
    }
    
    try {
      // If it's already an absolute URL (starts with http or https), return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      // If it's a relative URL, prepend the API base URL
      const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      // Handle various path formats
      if (url.startsWith('/')) {
        // Already has leading slash
        return `${baseUrl}${url}`;
      } else {
        // Add leading slash if missing
        return `${baseUrl}/${url}`;
      }
    } catch (error) {
      console.error("Error processing image URL:", error);
      return null;
    }
  };

  // Add auto-refresh for notifications
  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`${USER_API_END_POINT}/me`, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            // Include any auth tokens from localStorage if your backend uses them
            ...(localStorage.getItem('token') && {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            })
          }
        });
        
        if (response.data.success) {
          // Use a more reliable way to compare objects by comparing specific fields
          // that are important for UI updates, rather than the entire object
          const currentUser = response.data.user;
          const shouldUpdate = 
            !user || 
            currentUser._id !== user._id || 
            currentUser.name !== user.name || 
            currentUser.email !== user.email || 
            currentUser.role !== user.role || 
            (currentUser.notifications?.length !== user.notifications?.length);
          
          if (shouldUpdate) {
            dispatch(setUser(currentUser));
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        
        // Handle authentication errors
        if (error.response?.status === 401) {
          console.warn("Authentication error in Navbar");
          // Don't show error toast on every auto-refresh
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
            // Clear any stored credentials
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            dispatch(setUser(null));
            // Don't auto-redirect for better UX - let user see current page
            // toast.error("Your session has expired. Please login again");
          }
        }
      }
    };

    fetchUserData();
    const intervalId = setInterval(fetchUserData, 30000); // Increased from 15s to 30s to reduce server load
    return () => clearInterval(intervalId);
  }, [dispatch, refreshTrigger]); // Removed user from dependencies to prevent infinite loop

  // Mark all notifications as read when popover closes
  const handlePopoverOpenChange = (open) => {
    popoverOpen.current = open;
    
    if (!open && user?.notifications?.some(n => !n.isRead)) {
      // Mark all as read when popover closes
      axios.post(`${USER_API_END_POINT}/mark-notifications-read`, {}, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      .then(() => {
        // Update local state if there were unread notifications
        setRefreshTrigger(prev => prev + 1);
        setHasViewedAllNotifications(true);
        // Refetch user data to get updated notification status
        axios.get(`${USER_API_END_POINT}/me`, { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
          .then(response => {
            if (response.data.success) {
              dispatch(setUser(response.data.user));
            }
          });
      })
      .catch(error => {
        console.error("Error marking notifications as read:", error);
      });
    }
  };

  const toggleNotificationExpand = (notificationId) => {
    setExpandedNotifications(prev => ({
      ...prev,
      [notificationId]: !prev[notificationId]
    }));
  };

  const logOutHandler = async () => {
    try {
      // Clear local state first
      dispatch(setUser(null));
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Then try to call logout API
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (res.data.success) {
        toast.success(res.data.message || "Logged out successfully");
      }
      
      // Navigate to login
      navigate("/login");
    } catch (error) {
      console.log(error);
      
      // Even if API call fails, ensure local cleanup
      dispatch(setUser(null));
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      
      // Show error but still redirect to login
      toast.error(error.response?.data?.message || "Logged out with errors");
      navigate("/login");
    }
  };

  // Profile Completion Progress Calculation
  const calculateProfileProgress = () => {
    if (!user?.profile || user?.role === "recruiter") return 0;
    let fields = ["profilePhoto", "bio", "skills", "resume", "courseName", "courseField"];
    let filledFields = fields.filter((field) => user.profile[field]);
    return Math.round((filledFields.length / fields.length) * 100);
  };

  const profileProgress = calculateProfileProgress();

  // Add this function to format the notification time
  const formatNotificationTime = (timeString) => {
    if (!timeString) return "Just now";
    
    const date = new Date(timeString);
    const now = new Date();
    
    // Validate date object
    if (isNaN(date.getTime())) return "Recently";
    
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 60) {
      return `${diffInMinutes || 1}m`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Add this function to handle notification click
  const handleNotificationClick = (notification) => {
    // Mark specific notification as read
    if (notification.jobId) {
      navigate(`/description/${notification.jobId}`);
    }
  };

  // Check if notification message is long (more than 65 characters)
  const isLongMessage = (message) => {
    return message?.length > 65;
  };

  // Update the notification filtering logic
  const now = new Date();
  const newNotifications = user?.notifications?.filter(n => {
    const notificationDate = new Date(n.createdAt || n.time);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    return !n.isRead && diffInHours <= 24;
  }) || [];
  
  const previousNotifications = user?.notifications?.filter(n => {
    const notificationDate = new Date(n.createdAt || n.time);
    const diffInHours = (now - notificationDate) / (1000 * 60 * 60);
    return n.isRead || diffInHours > 24;
  }) || [];

  // Count only unread notifications for the badge, but only if not all notifications have been viewed
  const unreadNotifications = hasViewedAllNotifications ? 0 : (user?.notifications?.filter(n => !n.isRead)?.length || 0);

  // Reset hasViewedAllNotifications when new notifications arrive
  useEffect(() => {
    if (user?.notifications?.some(n => !n.isRead)) {
      setHasViewedAllNotifications(false);
    }
  }, [user?.notifications]);

  return (
    <div className="bg-white/60 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="flex items-center justify-between max-w-7xl mx-auto h-16 px-4">
        {/* Logo and Brand Name */}
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
          <Avatar className="h-10 w-10">
            <AvatarImage 
              src={logo2} 
              alt="HireWave Logo" 
              onError={(e) => {
                console.log("Logo image load error, using fallback");
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=HW&background=4f46e5&color=fff`;
              }}
            />
          </Avatar>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            HireWave
          </h1>
        </Link>

        {/* Navigation Links - Enhanced with animations and dropdowns */}
        <ul className="hidden md:flex items-center gap-8 font-medium text-base">
          {user?.role === "recruiter" && (
            <>
              <li>
                <Link to="/admin/jobs" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                  <Briefcase className="w-4 h-4" />
                  Jobs
                </Link>
              </li>
              <li>
                <Link to="/admin/companies" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                  <Building2 className="w-4 h-4" />
                  Companies
                </Link>
              </li>
              <li>
                <Link to="/admin/analytics" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                  <BarChart className="w-4 h-4" />
                  Analytics
                </Link>
              </li>
            </>
          )}
          {user?.role === "student" && (
            <>
              <li>
                <Link to="/jobs" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                  <Briefcase className="w-4 h-4" />
                  Jobs
                </Link>
              </li>
              <li>
                <Link to="/candidate/dashboard" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50">
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
              </li>
              <li className="relative">
                <Popover open={browseDropdownOpen} onOpenChange={setBrowseDropdownOpen}>
                  <PopoverTrigger asChild>
                    <button 
                      className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50"
                      onClick={() => setBrowseDropdownOpen(!browseDropdownOpen)}
                    >
                      <Search className="w-4 h-4" />
                      Browse
                      <ChevronDown className={`h-4 w-4 transition-transform ${browseDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent asChild>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-52"
                    >
                      <Link 
                        to="/browse" 
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setBrowseDropdownOpen(false)}
                      >
                        <ListFilter className="h-4 w-4" />
                        <span>All Jobs</span>
                      </Link>
                      <Link 
                        to="/recommended-jobs" 
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setBrowseDropdownOpen(false)}
                      >
                        <Sparkles className="h-4 w-4" />
                        <span>Recommended Jobs</span>
                      </Link>
                      <Link 
                        to="/jobs-near-you" 
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                        onClick={() => setBrowseDropdownOpen(false)}
                      >
                        <MapPin className="h-4 w-4" />
                        <span>Jobs Near You</span>
                      </Link>
                    </motion.div>
                  </PopoverContent>
                </Popover>
              </li>
              <li>
                <Link 
                  to="/profile" 
                  className="hover:text-blue-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50"
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </li>
            </>
          )}
        </ul>
        {/* Mobile Navigation Menu */}
        <div className="md:hidden">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Menu className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent asChild>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="w-screen h-screen fixed inset-0 bg-white z-50 p-4"
              >
                <div className="flex justify-between items-center mb-10">
                  <Link to="/" className="flex items-center gap-2.5">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={logo2} alt="HireWave Logo" />
                    </Avatar>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                      HireWave
                    </h1>
                  </Link>
                  <PopoverClose asChild>
                    <Button variant="ghost" size="icon" className="h-10 w-10">
                      <X className="h-5 w-5" />
                    </Button>
                  </PopoverClose>
                </div>
                
                <div className="space-y-4">
                  {user?.role === "recruiter" && (
                    <>
                      <Link to="/admin/jobs" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Jobs</span>
                      </Link>
                      <Link to="/admin/companies" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Companies</span>
                      </Link>
                      <Link to="/admin/analytics" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <BarChart className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Analytics</span>
                      </Link>
                    </>
                  )}
                  
                  {user?.role === "student" && (
                    <>
                      <Link to="/jobs" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Jobs</span>
                      </Link>
                      <Link to="/candidate/dashboard" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <LayoutDashboard className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <Link to="/browse" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <Search className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Browse Jobs</span>
                      </Link>
                      <Link to="/profile" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                        <User className="w-5 h-5 text-blue-600" />
                        <span className="font-medium">Profile</span>
                      </Link>
                    </>
                  )}
                  
                  {/* Add About and Contact links for all users */}
                  <Link to="/about" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <InfoIcon className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">About</span>
                  </Link>
                  <Link to="/contact" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">Contact</span>
                  </Link>
                  
                  {user ? (
                    <Button
                      variant="outline"
                      onClick={logOutHandler}
                      className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors mt-6"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-3 mt-6">
                      <Link to="/login">
                        <Button variant="outline" className="w-full hover:bg-gray-50 border-gray-200 text-gray-700">
                          Login
                        </Button>
                      </Link>
                      <Link to="/signup">
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                          Sign up
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </motion.div>
            </PopoverContent>
          </Popover>
        </div>

        {/* User Profile and Notifications */}
        {user ? (
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Popover onOpenChange={handlePopoverOpenChange}>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  <div className="p-2 hover:bg-gray-100 rounded-full transition-colors group">
                    <div className="relative">
                      <BellIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-500 transition-colors" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold h-4 w-4 flex items-center justify-center rounded-full">
                          {unreadNotifications}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent asChild>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="w-[350px] rounded-xl shadow-xl p-4 border border-gray-200 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-800">Notifications</h3>
                    </div>
                  </div>
                  
                  {/* Notification Tabs */}
                  {(newNotifications.length > 0 || previousNotifications.length > 0) && (
                    <div className="flex items-center gap-2 mb-3 border-b border-gray-200">
                      <button
                        onClick={() => setActiveTab("new")}
                        className={`px-3 py-1.5 text-sm font-medium relative ${
                          activeTab === "new" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        New {newNotifications.length > 0 && `(${newNotifications.length})`}
                        {activeTab === "new" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                        )}
                      </button>
                      <button
                        onClick={() => setActiveTab("previous")}
                        className={`px-3 py-1.5 text-sm font-medium relative ${
                          activeTab === "previous" ? "text-blue-600" : "text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        Previous {previousNotifications.length > 0 && `(${previousNotifications.length})`}
                        {activeTab === "previous" && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></span>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* New Notifications */}
                  {activeTab === "new" && (
                    <>
                      {newNotifications.length > 0 ? (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                          {newNotifications.map((notification, index) => {
                            const notificationId = `new-${index}`;
                            const isExpanded = expandedNotifications[notificationId];
                            const isLong = isLongMessage(notification.message);
                            
                            return (
                              <div
                                key={notificationId}
                                className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-blue-100 bg-blue-50"
                              >
                                <div className="flex items-start gap-2">
                                  {notification.companyLogo ? (
                                    <Avatar className="h-8 w-8 rounded-md ring-1 ring-gray-100">
                                      <AvatarImage 
                                        src={getImageUrl(notification.companyLogo)} 
                                        alt="Company" 
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          // Try to use company name or generic icon
                                          if (notification.companyName) {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.companyName)}&background=random`;
                                          } else {
                                            e.target.src = `https://ui-avatars.com/api/?name=CO&background=4f46e5&color=fff`;
                                          }
                                        }}
                                      />
                                    </Avatar>
                                  ) : (
                                    <div className="h-8 w-8 rounded-md bg-blue-100 flex items-center justify-center">
                                      <Dot className="h-5 w-5 text-blue-500" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div 
                                      onClick={() => handleNotificationClick(notification)}
                                      className="relative"
                                    >
                                      <p className={`text-sm text-gray-700 leading-snug ${isLong && !isExpanded ? 'line-clamp-1' : ''}`}>
                                        {notification.message}
                                      </p>
                                      
                                      {isLong && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleNotificationExpand(notificationId);
                                          }} 
                                          className="text-xs text-blue-600 mt-1 flex items-center hover:underline"
                                        >
                                          {isExpanded ? (
                                            <>Show less <ChevronUp className="h-3 w-3 ml-0.5" /></>
                                          ) : (
                                            <>Show more <ChevronDown className="h-3 w-3 ml-0.5" /></>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                        notification.type === 'success' 
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-blue-100 text-blue-700'
                                      }`}>
                                        {notification.type === 'success' ? 'Selected' : 'Update'}
                                      </span>
                                      <span className="text-xs text-gray-400">
                                        {formatNotificationTime(notification.createdAt || notification.time)}
                                      </span>
                                      <ArrowRight className="h-3 w-3 text-gray-400 ml-auto" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : previousNotifications.length > 0 ? (
                        <div className="text-center py-3">
                          <p className="text-gray-500 text-sm">No new notifications</p>
                          <button 
                            onClick={() => setActiveTab("previous")}
                            className="mt-1 text-xs text-blue-600 hover:underline"
                          >
                            View previous notifications
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 text-sm">No notifications yet</p>
                          <p className="text-gray-400 text-xs mt-1">
                            We'll notify you when there are updates
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Previous Notifications */}
                  {activeTab === "previous" && (
                    <div className="space-y-2 max-h-[350px] overflow-y-auto">
                      {previousNotifications.length > 0 ? (
                        <>
                          <div className="flex items-center mb-1">
                            <Clock className="h-3.5 w-3.5 text-gray-400 mr-1.5" />
                            <span className="text-xs text-gray-400">Previously viewed</span>
                          </div>
                          {previousNotifications.map((notification, index) => {
                            const notificationId = `prev-${index}`;
                            const isExpanded = expandedNotifications[notificationId];
                            const isLong = isLongMessage(notification.message);
                            
                            return (
                              <div
                                key={notificationId}
                                className="p-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer border border-gray-100 opacity-80"
                              >
                                <div className="flex items-start gap-2">
                                  {notification.companyLogo ? (
                                    <Avatar className="h-8 w-8 rounded-md ring-1 ring-gray-100">
                                      <AvatarImage 
                                        src={getImageUrl(notification.companyLogo)} 
                                        alt="Company" 
                                        onError={(e) => {
                                          e.target.onerror = null;
                                          // Try to use company name or generic icon
                                          if (notification.companyName) {
                                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.companyName)}&background=random`;
                                          } else {
                                            e.target.src = `https://ui-avatars.com/api/?name=CO&background=4f46e5&color=fff`;
                                          }
                                        }}
                                      />
                                    </Avatar>
                                  ) : (
                                    <div className="h-8 w-8 rounded-md bg-gray-100 flex items-center justify-center">
                                      <Dot className="h-5 w-5 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <div 
                                      onClick={() => handleNotificationClick(notification)}
                                      className="relative"
                                    >
                                      <p className={`text-sm text-gray-600 leading-snug ${isLong && !isExpanded ? 'line-clamp-1' : ''}`}>
                                        {notification.message}
                                      </p>
                                      
                                      {isLong && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleNotificationExpand(notificationId);
                                          }} 
                                          className="text-xs text-blue-600 mt-1 flex items-center hover:underline"
                                        >
                                          {isExpanded ? (
                                            <>Show less <ChevronUp className="h-3 w-3 ml-0.5" /></>
                                          ) : (
                                            <>Show more <ChevronDown className="h-3 w-3 ml-0.5" /></>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gray-400">
                                        {formatNotificationTime(notification.createdAt || notification.time)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-gray-500 text-sm">No previous notifications</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              </PopoverContent>
            </Popover>

            {/* User Profile */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer">
                  {user.role === "student" ? (
                    <div className="relative w-10 h-10">
                      <CircularProgressbar
                        value={profileProgress}
                        strokeWidth={7}
                        styles={buildStyles({
                          pathColor: profileProgress < 50 ? "red" : profileProgress < 80 ? "orange" : "#45ba4a",
                          trailColor: "#ddd",
                          strokeLinecap: "round"
                        })}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={getImageUrl(user?.profile?.profilePhoto) || logo} 
                            alt={user?.fullname || "User"}
                            onError={(e) => {
                              console.log("Student image load error, using fallback");
                              e.target.onerror = null;
                              // Try to use name initials as fallback
                              if (user?.fullname) {
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`;
                              } else {
                                e.target.src = logo;
                              }
                            }}
                          />
                        </Avatar>
                      </div>
                    </div>
                  ) : (
                    // For recruiters, show company logo if available
                    <Avatar className="h-10 w-10 ring-2 ring-gray-100">
                      <AvatarImage 
                        src={getImageUrl(user?.profile?.company?.logo) || getImageUrl(user?.profile?.profilePhoto) || logo} 
                        alt={user?.profile?.company?.name || user?.fullname || "Company Logo"}
                        onError={(e) => {
                          console.log("Image load error, using fallback");
                          e.target.onerror = null;
                          // Try company name if available
                          if (user?.profile?.company?.name) {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile.company.name)}&background=random`;
                          } 
                          // Try user name if available
                          else if (user?.fullname) {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`;
                          } 
                          // Final fallback
                          else {
                            e.target.src = logo;
                          }
                        }} 
                      />
                    </Avatar>
                  )}
                </div>
              </PopoverTrigger>
              <PopoverContent asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="w-80 rounded-xl shadow-xl p-4 border border-gray-200 bg-white"
                >
                  {/* Profile Section */}
                  <div className="flex items-center gap-4 p-2">
                    {user?.role === "student" ? (
                      <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                        <AvatarImage 
                          src={getImageUrl(user?.profile?.profilePhoto) || logo} 
                          alt={user?.fullname || "User"}
                          onError={(e) => {
                            console.log("Profile dropdown image load error, using fallback");
                            e.target.onerror = null;
                            // Try to use name initials as fallback
                            if (user?.fullname) {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`;
                            } else {
                              e.target.src = logo;
                            }
                          }}
                        />
                      </Avatar>
                    ) : (
                      // Show company logo for recruiters
                      <Avatar className="h-12 w-12 ring-2 ring-gray-100">
                        <AvatarImage 
                          src={getImageUrl(user?.profile?.company?.logo) || getImageUrl(user?.profile?.profilePhoto) || logo} 
                          alt={user?.profile?.company?.name || user?.fullname || "Company Logo"}
                          onError={(e) => {
                            console.log("Image load error, using fallback");
                            e.target.onerror = null;
                            // Try company name if available
                            if (user?.profile?.company?.name) {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.profile.company.name)}&background=random`;
                            } 
                            // Try user name if available
                            else if (user?.fullname) {
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.fullname)}&background=random`;
                            } 
                            // Final fallback
                            else {
                              e.target.src = logo;
                            }
                          }} 
                        />
                      </Avatar>
                    )}
                    <div>
                      {user?.role === "student" ? (
                        <>
                          <h4 className="font-semibold text-gray-800">{user?.fullname}</h4>
                          <p className="text-sm text-gray-500">
                            {user?.profile?.courseField && user?.profile?.courseName
                              ? `${user.profile.courseField} / ${user.profile.courseName}`
                              : "Course not provided"}
                          </p>
                        </>
                      ) : (
                        // Show company name for recruiters
                        <>
                          <h4 className="font-semibold text-gray-800">
                            {user?.profile?.company?.name || user?.fullname}
                          </h4>
                          <p className="text-sm text-gray-500">Recruiter Account</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Profile Actions */}
                  <div className="flex flex-col gap-2 mt-3">
                    {user?.role === "student" ? (
                      <Link to="/profile">
                        <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                          View & Update Profile
                        </Button>
                      </Link>
                    ) : (
                      // For recruiters, link to company management
                      <div className="flex flex-col gap-2">
                        <Link to="/admin/companies">
                          <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
                            Manage Company
                          </Button>
                        </Link>
                        <Link to="/admin/settings">
                          <Button variant="outline" className="w-full flex items-center justify-center gap-2 text-gray-700">
                            <Settings className="h-4 w-4" />
                            Recruiter Settings
                          </Button>
                        </Link>
                      </div>
                    )}

                    {user?.role === "student" && (
                      <Link to="/candidate/dashboard">
                        <Button variant="outline" className="w-full flex items-center gap-2 text-gray-700">
                          <Briefcase className="h-4 w-4" />
                          My Dashboard
                        </Button>
                      </Link>
                    )}

                    <Link to="/settings">
                      <Button variant="outline" className="w-full flex items-center gap-2 text-gray-700">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Button>
                    </Link>

                    {user?.role === "student" && (
                      <Link to="/faqs">
                        <Button variant="outline" className="w-full flex items-center gap-2 text-gray-700">
                          <HelpCircle className="h-4 w-4" />
                          FAQs
                        </Button>
                      </Link>
                    )}

                    <Button
                      variant="outline"
                      onClick={logOutHandler}
                      className="w-full flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </motion.div>
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline" className="hover:bg-gray-50 border-gray-200 text-gray-700">
                Login
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
