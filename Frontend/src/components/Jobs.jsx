import React, { useState, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
import Navbar from './shared/Navbar';
import { useSelector } from 'react-redux';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { AnimatePresence, motion } from 'framer-motion';
import { Briefcase, Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Lazy loaded components
const FilterCard = lazy(() => import('./FilterCard'));
const Job = lazy(() => import('./Job'));

// Loading fallback components
const FilterCardSkeleton = () => (
  <div className="bg-white p-3 rounded-lg shadow-md animate-pulse">
    <div className="h-8 w-3/4 bg-slate-200 rounded mb-4"></div>
    <div className="h-px bg-slate-200 mb-4"></div>
    {[1, 2, 3].map((i) => (
      <div key={i} className="mb-6">
        <div className="h-6 w-1/2 bg-slate-200 rounded mb-3"></div>
        <div className="space-y-2">
          {[1, 2, 3].map((j) => (
            <div key={j} className="flex items-center">
              <div className="w-4 h-4 bg-slate-200 rounded mr-2"></div>
              <div className="h-4 w-24 bg-slate-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
    <div className="h-8 w-full bg-red-200 rounded-md"></div>
  </div>
);

const JobSkeleton = () => (
  <div className="p-6 border bg-white rounded-xl shadow-md w-full animate-pulse">
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 bg-slate-200 rounded-xl"></div>
        <div>
          <div className="h-5 w-32 bg-slate-200 rounded mb-2"></div>
          <div className="h-4 w-24 bg-slate-200 rounded"></div>
        </div>
      </div>
      <div className="h-8 w-8 bg-slate-200 rounded-full"></div>
    </div>
    <div className="h-6 w-3/4 bg-slate-200 rounded mb-3"></div>
    <div className="h-4 w-full bg-slate-200 rounded mb-4"></div>
    <div className="flex gap-4 mb-4">
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
      <div className="h-5 w-20 bg-slate-200 rounded"></div>
    </div>
    <div className="flex gap-4 mb-3">
      <div className="h-10 w-full bg-slate-200 rounded"></div>
      <div className="h-10 w-full bg-blue-200 rounded"></div>
    </div>
    <div className="h-4 w-24 bg-slate-200 rounded ml-auto"></div>
  </div>
);

const Jobs = () => {
  // Use custom hook to fetch all jobs
  useGetAllJobs();
  const { allJobs } = useSelector((store) => store.job);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [isFilterLoaded, setIsFilterLoaded] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Lazy loading state
  const [visibleJobs, setVisibleJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const JOBS_PER_PAGE = 6; // Number of jobs to load per batch
  
  // Initialize when allJobs changes
  useEffect(() => {
    if (!allJobs || !allJobs.length) return;
    
    // Update the filtered jobs
    setFilteredJobs(allJobs);
    
    // Initial jobs to display
    setVisibleJobs(allJobs.slice(0, JOBS_PER_PAGE));
  }, [allJobs]);

  // Filter jobs based on search term
  useEffect(() => {
    if (!allJobs) return;

    let filtered = [...allJobs];
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(job => {
        return (
          (job.title && job.title.toLowerCase().includes(term)) || 
          (job.company?.name && job.company.name.toLowerCase().includes(term)) || 
          (job.jobLocation && job.jobLocation.toLowerCase().includes(term)) || 
          (job.jobType && job.jobType.toLowerCase().includes(term)) ||
          (job.description && job.description.toLowerCase().includes(term))
        );
      });
    }
    
    // Apply other filters from FilterCard component
    Object.entries(appliedFilters).forEach(([filterType, values]) => {
      if (!values || values.length === 0) return;
      
      switch (filterType) {
        case 'Location':
          filtered = filtered.filter(job => {
            return values.includes(job.jobLocation);
          });
          break;
        case 'Job Type':
          filtered = filtered.filter(job => {
            return values.includes(job.jobType);
          });
          break;
        case 'Salary':
          filtered = filtered.filter(job => {
            const salary = parseInt(job.salary);
            if (isNaN(salary)) return false;
            
            if (values.includes('1-10 LPA')) {
              return salary >= 1 && salary <= 10;
            } else if (values.includes('10-20 LPA')) {
              return salary >= 10 && salary <= 20;
            } else if (values.includes('20+ LPA')) {
              return salary >= 20;
            }
            return false;
          });
          break;
        default:
          break;
      }
    });
    
    setFilteredJobs(filtered);
    setVisibleJobs(filtered.slice(0, JOBS_PER_PAGE));
  }, [searchTerm, appliedFilters, allJobs]);
  
  // Ref for the intersection observer
  const observer = useRef();
  const lastJobElementRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        // Load more when last element is visible
        loadMoreJobs();
      }
    }, { rootMargin: '100px' });
    
    if (node) observer.current.observe(node);
  }, [isLoading, filteredJobs.length, visibleJobs.length]);
  
  // Load more jobs when scrolling
  const loadMoreJobs = () => {
    if (isLoading || visibleJobs.length >= filteredJobs.length) return;
    
    setIsLoading(true);
    
    // Small delay to prevent multiple loads
    setTimeout(() => {
      const nextItems = filteredJobs.slice(
        visibleJobs.length, 
        visibleJobs.length + JOBS_PER_PAGE
      );
      
      if (nextItems.length > 0) {
        setVisibleJobs(prev => [...prev, ...nextItems]);
      }
      
      setIsLoading(false);
    }, 100);
  };
  
  // Handle filter changes
  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
  };

  // Mark filter as loaded when it's rendered
  const handleFilterLoaded = () => {
    setIsFilterLoaded(true);
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Clear filters
  const handleClearFilters = () => {
    setAppliedFilters({}); // This will automatically sync with FilterCard due to the prop
    setSearchTerm('');
  };

  // Count active filters
  const activeFiltersCount = Object.values(appliedFilters).reduce(
    (count, values) => count + (values?.length || 0), 
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-8 pb-16">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Find Your Perfect Job</h1>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search jobs by title, company, or location..."
              className="pl-10 py-6 text-base rounded-lg shadow-sm border-gray-200 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Filters */}
          <div className="w-full lg:w-1/4 lg:sticky lg:top-16">
            <div className="hidden lg:block">
              <Suspense fallback={<FilterCardSkeleton />}>
                <FilterCard 
                  onFilterChange={handleFilterChange} 
                  onLoad={handleFilterLoaded}
                  appliedFilters={appliedFilters}
                />
              </Suspense>
            </div>
            
            {/* Mobile filter button */}
            <div className="lg:hidden">
              <Button 
                onClick={() => setIsFilterOpen(!isFilterOpen)} 
                variant="outline" 
                className="w-full flex items-center justify-between mb-4"
              >
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4" />
                  <span>Filters</span>
                </div>
                {activeFiltersCount > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
              
              {isFilterOpen && (
                <div className="mb-6">
                  <Suspense fallback={<FilterCardSkeleton />}>
                    <FilterCard 
                      onFilterChange={handleFilterChange} 
                      onLoad={handleFilterLoaded}
                      appliedFilters={appliedFilters}
                    />
                  </Suspense>
                </div>
              )}
            </div>
            
            {/* Applied filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mt-2 mb-4">
                {Object.entries(appliedFilters).map(([filterType, values]) => 
                  values && values.map(value => (
                    <Badge 
                      key={`${filterType}-${value}`}
                      className="flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-3 py-1"
                    >
                      <span>{value}</span>
                      <button 
                        onClick={() => {
                          const newFilters = {...appliedFilters};
                          newFilters[filterType] = newFilters[filterType].filter(v => v !== value);
                          if (newFilters[filterType].length === 0) {
                            delete newFilters[filterType];
                          }
                          setAppliedFilters(newFilters);
                        }}
                        className="ml-1 rounded-full hover:bg-blue-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                )}
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  Clear all
                </Button>
              </div>
            )}
          </div>

          {/* Right Content - Job Listings */}
          <div className="w-full lg:w-3/4">
            {/* Results info */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-blue-500" />
                  {searchTerm ? 'Search Results' : 'Available Positions'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Found {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'}
                  {searchTerm && <> for "<span className="font-medium">{searchTerm}</span>"</>}
                </p>
              </div>
            </div>
            
            {/* Job listings */}
            {filteredJobs.length <= 0 ? (
              <div className="flex justify-center items-center h-[70vh]">
                <div className="text-center p-8 bg-white rounded-lg shadow-md">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No jobs found</h3>
                  <p className="text-gray-600 mb-6">Try adjusting your filters or check back later for new opportunities</p>
                  <Button 
                    onClick={handleClearFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Clear all filters
                  </Button>
                </div>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid gap-6"
                >
                  {visibleJobs.map((job, index) => {
                    // Add ref to last element for infinite scrolling
                    const isLastElement = index === visibleJobs.length - 1;
                    
                    return (
                      <motion.div 
                        key={job?._id} 
                        ref={isLastElement ? lastJobElementRef : null}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="w-full"
                      >
                        <Suspense fallback={<JobSkeleton />}>
                          <Job job={job} variant="list" />
                        </Suspense>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            )}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-blue-600">Loading more jobs...</span>
              </div>
            )}
            
            {/* End of results */}
            {!isLoading && visibleJobs.length === filteredJobs.length && filteredJobs.length > 0 && (
              <div className="text-center py-8 text-gray-500">
                You've reached the end of the list.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobs;
