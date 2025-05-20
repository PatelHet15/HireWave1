import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

const filterData = [
  {
    filterType: 'Location',
    array: ['Delhi', 'Mumbai', 'Hyderabad','Pune','Bangalore'], // Add more locations as needed
  },
  {
    filterType: 'Job Type',
    array: ['Full Time', 'Part Time', 'Internship'], // Match jobType field
  },
  {
    filterType: 'Salary',
    array: ['1-10 LPA', '10-20 LPA', '20+ LPA'], // Adjust salary ranges as needed
  },
];

const FilterCard = ({ onFilterChange, onLoad, appliedFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState(appliedFilters || {});
  const [expandedFilters, setExpandedFilters] = useState(
    filterData.reduce((acc, data) => {
      acc[data.filterType] = true;
      return acc;
    }, {})
  );

  // Update local state when external filters change
  useEffect(() => {
    setSelectedFilters(appliedFilters || {});
  }, [appliedFilters]);

  // Notify parent component that the filter has loaded
  useEffect(() => {
    if (onLoad) {
      onLoad();
    }
  }, [onLoad]);

  const toggleFilter = (filterType) => {
    setExpandedFilters((prev) => ({
      ...prev,
      [filterType]: !prev[filterType],
    }));
  };

  const handleCheckboxChange = (filterType, value) => {
    const updatedFilters = { ...selectedFilters };
    if (!updatedFilters[filterType]) {
      updatedFilters[filterType] = [];
    }
    if (updatedFilters[filterType].includes(value)) {
      updatedFilters[filterType] = updatedFilters[filterType].filter((item) => item !== value);
    } else {
      updatedFilters[filterType].push(value);
    }
    setSelectedFilters(updatedFilters);
    onFilterChange(updatedFilters); // Pass selected filters to parent
  };

  const clearFilters = () => {
    setSelectedFilters({});
    onFilterChange({}); // Clear filters in parent component
  };

  // Count total selected filters
  const totalSelectedFilters = Object.values(selectedFilters).flat().length;

  return (
    <div className='bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:border-blue-100 transition-all duration-200 w-full h-fit max-h-[90vh] overflow-y-auto'>
      <div className='flex justify-between items-center mb-4'>
        <div>
          <h1 className='text-lg font-semibold text-gray-800'>Filters</h1>
          {totalSelectedFilters > 0 && (
            <span className='text-sm text-gray-500'>
              {totalSelectedFilters} filter{totalSelectedFilters > 1 ? 's' : ''} applied
            </span>
          )}
        </div>
        {totalSelectedFilters > 0 && (
          <button
            onClick={clearFilters}
            className='flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200'
          >
            <X className='h-4 w-4' />
            Clear all
          </button>
        )}
      </div>

      <div className='space-y-2'>
        {filterData.map((data, index) => (
          <div key={index} className='border-t border-gray-100 pt-3 first:border-0 first:pt-0'>
            <button
              className='w-full flex justify-between items-center group'
              onClick={() => toggleFilter(data.filterType)}
            >
              <h3 className='text-base font-medium text-gray-700 group-hover:text-gray-900'>
                {data.filterType}
                {selectedFilters[data.filterType]?.length > 0 && (
                  <span className='ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full'>
                    {selectedFilters[data.filterType].length}
                  </span>
                )}
              </h3>
              {expandedFilters[data.filterType] ? (
                <ChevronUp className='h-4.5 w-4.5 text-gray-400 group-hover:text-gray-600' />
              ) : (
                <ChevronDown className='h-4.5 w-4.5 text-gray-400 group-hover:text-gray-600' />
              )}
            </button>
            
            {expandedFilters[data.filterType] && (
              <div className='mt-2.5 space-y-1.5'>
                {data.array.map((item, idx) => (
                  <label
                    key={idx}
                    className='flex items-center gap-2.5 px-2.5 py-1  rounded-lg hover:bg-gray-50 cursor-pointer group/item'
                  >
                    <input
                      type='checkbox'
                      id={`${data.filterType}-${idx}`}
                      checked={selectedFilters[data.filterType]?.includes(item) || false}
                      onChange={() => handleCheckboxChange(data.filterType, item)}
                      className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors'
                    />
                    <span className='text-sm text-gray-600 group-hover/item:text-gray-900'>
                      {item}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FilterCard;