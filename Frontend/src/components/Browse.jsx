import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useLocation, Link } from "react-router-dom";
import Navbar from "./shared/Navbar";
import Job from "./Job";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/Redux/jobSlice";
import useGetAllJobs from "@/hooks/useGetAllJobs";
import { Search, X, Filter, SlidersHorizontal, BriefcaseIcon, MapPin, Clock, ArrowDownAZ, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { DollarSign } from "lucide-react";

const Browse = () => {
  // Get search params from URL
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const dispatch = useDispatch();
  
  // Get the search query from URL parameters or use empty string
  const urlSearchQuery = searchParams.get('search') || "";
  const [searchQuery, setSearchQuery] = useState(urlSearchQuery);
  
  // Use the hook to fetch jobs based on the search query
  useGetAllJobs();
  const { allJobs } = useSelector((store) => store.job);
  const [filteredJobs, setFilteredJobs] = useState([]);
  
  // UI state
  const [activeView, setActiveView] = useState("grid");
  const [sortOption, setSortOption] = useState("recent");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [popularSearches] = useState(["Software Engineer", "Marketing", "Remote", "Full-time", "Internship"]);
  
  // Lazy loading state
  const [visibleJobs, setVisibleJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const JOBS_PER_PAGE = 9;

  // Last element ref for intersection observer
  const lastJobElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreJobs();
      }
    }, { 
      rootMargin: '200px',
      threshold: 0.1 
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore]);

  // Load more jobs function
  const loadMoreJobs = () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    
    setTimeout(() => {
      const nextBatch = sortedJobs.slice(
        visibleJobs.length,
        visibleJobs.length + JOBS_PER_PAGE
      );
      
      if (nextBatch.length > 0) {
        setVisibleJobs(prev => [...prev, ...nextBatch]);
        setHasMore(visibleJobs.length + nextBatch.length < sortedJobs.length);
      } else {
        setHasMore(false);
      }
      
      setIsLoading(false);
    }, 200);
  };

  // Set search query from URL when component mounts or URL changes
  useEffect(() => {
    const searchFromUrl = searchParams.get('search');
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
      dispatch(setSearchedQuery(searchFromUrl));
    } else {
      setSearchQuery("");
      dispatch(setSearchedQuery(""));
    }
  }, [location.search, dispatch, searchParams]);

  // Filter jobs based on multiple criteria
  useEffect(() => {
    if (!searchQuery) {
      setFilteredJobs(allJobs); 
    } else {
      const searchLower = searchQuery.toLowerCase();
      const filtered = allJobs.filter((job) => {
        return (
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          (job.company?.name && job.company.name.toLowerCase().includes(searchLower)) ||
          (job.position && job.position.toLowerCase().includes(searchLower)) ||
          (job.jobLocation && job.jobLocation.toLowerCase().includes(searchLower)) ||
          (job.company?.location && job.company.location.toLowerCase().includes(searchLower)) ||
          (job.jobType && job.jobType.toLowerCase().includes(searchLower))
        );
      });
      setFilteredJobs(filtered);
    }
  }, [searchQuery, allJobs]);
  
  // Reset visible jobs when filtered jobs change
  useEffect(() => {
    setVisibleJobs(sortedJobs.slice(0, JOBS_PER_PAGE));
    setHasMore(JOBS_PER_PAGE < sortedJobs.length);
  }, [filteredJobs, sortOption]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setSearchParams({ search: value });
      dispatch(setSearchedQuery(value));
    } else {
      setSearchParams({});
      dispatch(setSearchedQuery(""));
    }
  };

  // Handle search form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery });
      dispatch(setSearchedQuery(searchQuery));
    }
  };
  
  // Handle popular search click
  const handlePopularSearchClick = (term) => {
    setSearchQuery(term);
    setSearchParams({ search: term });
    dispatch(setSearchedQuery(term));
  };
  
  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
    dispatch(setSearchedQuery(""));
  };
  
  // Sort jobs based on selected option
  const getSortedJobs = () => {
    if (sortOption === "recent") {
      return [...filteredJobs].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortOption === "salary") {
      return [...filteredJobs].sort((a, b) => {
        const salaryA = parseInt(a.salary) || 0;
        const salaryB = parseInt(b.salary) || 0;
        return salaryB - salaryA;
      });
    } else if (sortOption === "alphabetical") {
      return [...filteredJobs].sort((a, b) => {
        return (a.title || "").localeCompare(b.title || "");
      });
    }
    return filteredJobs;
  };
  
  const sortedJobs = getSortedJobs();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Modern Hero Section with Gradient */}
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl overflow-hidden mb-6 shadow-md relative">
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
          <div className="relative p-6">
            <div className="max-w-3xl mx-auto text-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {searchQuery ? <span>Results for "<span className="text-blue-600">{searchQuery}</span>"</span> : "Discover Your Dream Career"}
              </h1>
              <p className="text-gray-600 text-sm">
                {searchQuery ? `${filteredJobs.length} matching job${filteredJobs.length !== 1 ? 's' : ''} found` : "Find opportunities that match your skills"}
              </p>
            </div>
            
            <div className="max-w-xl mx-auto">
              <form onSubmit={handleSubmit} className="relative mb-4">
                <div className="flex items-center bg-white rounded-xl shadow-md border border-gray-100">
                  <div className="pl-3 pr-2"><Search className="text-blue-500 w-4 h-4" /></div>
                  <input
                    type="text"
                    placeholder="Job titles, companies, or locations..."
                    className="w-full py-3 px-2 border-none outline-none bg-transparent text-sm"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    list="search-suggestions"
                  />
                  {searchQuery && <button onClick={handleClearSearch} className="p-1 text-gray-400"><X className="w-4 h-4" /></button>}
                  <Button type="submit" className="m-1 bg-blue-600 text-white px-4 py-1 text-sm rounded-lg">Search</Button>
                </div>
                
                <datalist id="search-suggestions">
                  {popularSearches.map(term => <option key={term} value={term} />)}
                </datalist>
              </form>
              
              {!searchQuery && (
                <div className="flex flex-wrap justify-center gap-1 text-xs">
                  <span className="text-gray-600 px-1">Popular:</span>
                  {popularSearches.map(term => (
                    <button
                      key={term}
                      onClick={() => handlePopularSearchClick(term)}
                      className="px-2 py-1 bg-white hover:bg-blue-50 rounded-full text-gray-700 border border-gray-200"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* Job Results Section */}
          <div className="flex-1">
            {/* Results Header - Improved */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center">
                    <BriefcaseIcon className="h-5 w-5 mr-2 text-blue-500" />
                    {searchQuery ? 'Search Results' : 'All Jobs'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    Showing {visibleJobs.length} of {sortedJobs.length} job opportunities
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Sort Options - Redesigned */}
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                    <button
                      onClick={() => setSortOption("recent")}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                        sortOption === "recent" 
                          ? "bg-white shadow-sm text-blue-600 font-medium" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Clock className="w-4 h-4" />
                      Recent
                    </button>
                    <button
                      onClick={() => setSortOption("salary")}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                        sortOption === "salary" 
                          ? "bg-white shadow-sm text-blue-600 font-medium" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <DollarSign className="w-4 h-4" />
                      Salary
                    </button>
                    <button
                      onClick={() => setSortOption("alphabetical")}
                      className={`px-3 py-1.5 text-sm rounded-md flex items-center gap-1.5 transition-all ${
                        sortOption === "alphabetical" 
                          ? "bg-white shadow-sm text-blue-600 font-medium" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <ArrowDownAZ className="w-4 h-4" />
                      A-Z
                    </button>
                  </div>
                  
                  {/* View Options - Improved */}
                  <div className="flex items-center bg-gray-50 rounded-lg p-1 border border-gray-200 shadow-sm">
                    <button 
                      onClick={() => setActiveView("grid")}
                      className={`p-2 rounded-md ${
                        activeView === "grid" 
                          ? "bg-white shadow-sm text-blue-600" 
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-label="Grid View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => setActiveView("list")}
                      className={`p-2 rounded-md ${
                        activeView === "list" 
                          ? "bg-white shadow-sm text-blue-600" 
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                      aria-label="List View"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Mobile Filter Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="lg:hidden flex items-center gap-1"
                    onClick={() => setIsFilterOpen(true)}
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Active Filters - Enhanced */}
            {searchQuery && (
              <div className="flex flex-wrap gap-2 mb-6">
                <Badge className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex items-center font-medium border border-blue-100 shadow-sm">
                  {searchQuery}
                  <button 
                    onClick={handleClearSearch}
                    className="ml-2 text-blue-500 hover:text-blue-700 transition-colors bg-blue-100 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              </div>
            )}

            {/* Job Listings */}
            {sortedJobs.length > 0 ? (
              <div className={activeView === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                <AnimatePresence>
                  {visibleJobs.map((job, index) => {
                    const isLastElement = index === visibleJobs.length - 1;
                    
                    return (
                      <motion.div
                        key={job._id}
                        ref={isLastElement ? lastJobElementRef : null}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="h-full relative group"
                      >
                        <Job 
                          job={job} 
                          variant={activeView === "list" ? "list" : "grid"}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-blue-50">
                  <BriefcaseIcon className="h-7 w-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "We couldn't find any jobs matching your search. Try different keywords."
                    : "There are currently no job listings available. Please check back later."}
                </p>
                {searchQuery ? (
                  <Button 
                    onClick={handleClearSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
                  >
                    Clear Search
                  </Button>
                ) : (
                  <Button 
                    onClick={() => window.location.reload()}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6"
                  >
                    Refresh
                  </Button>
                )}
              </div>
            )}

            {/* Loading Indicator - Improved */}
            {isLoading && (
              <div className="flex justify-center items-center py-10">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-gray-200 border-t-blue-500"></div>
                  <p className="mt-4 text-sm text-gray-500">Loading more jobs...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Browse;