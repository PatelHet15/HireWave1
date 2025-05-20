import React, { useEffect } from 'react';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import useGetAllCompanies from '@/hooks/useGetAllCompanies';
import { useSelector, useDispatch } from 'react-redux';
import { Building, Plus, Settings } from 'lucide-react';
import useGetRecruiterCompany from '@/hooks/useGetRecruiterCompany';

const Companies = () => {
    // This will fetch all companies for this recruiter
    useGetAllCompanies();
    
    // This will specifically check if the logged-in recruiter has a company
    useGetRecruiterCompany();
    
    const navigate = useNavigate();
    const { recruiterCompany, hasCompany } = useSelector(store => store.company);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-4xl mx-auto py-10 px-4">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Your Company</h1>
                    {hasCompany && recruiterCompany ? (
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            onClick={() => navigate(`/admin/companies/${recruiterCompany._id}`)}
                        >
                            <Settings size={16} />
                            Manage Company
                        </Button>
                    ) : (
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                            onClick={() => navigate("/admin/companies/create")}
                        >
                            <Plus size={16} />
                            Set Up Company
                        </Button>
                    )}
                </div>
                
                {hasCompany && recruiterCompany ? (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden">
                        <div className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                            <div className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center bg-gray-50">
                                {recruiterCompany?.logo ? (
                                    <img 
                                        src={recruiterCompany.logo} 
                                        alt={recruiterCompany.name} 
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = "/src/assets/logo.png";
                                        }}
                                    />
                                ) : (
                                    <Building size={32} className="text-gray-400" />
                                )}
                            </div>
                            
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                                    {recruiterCompany?.name || "Unnamed Company"}
                                </h2>
                                <p className="text-gray-500 mb-2">
                                    {recruiterCompany?.location || "Location not specified"}
                                </p>
                                <div className="text-sm text-gray-600 line-clamp-2">
                                    {recruiterCompany?.aboutCompany || "No company description."}
                                </div>
                                
                                <div className="flex items-center gap-4 mt-4">
                                    <Button 
                                        variant="outline" 
                                        className="text-gray-700 border-gray-300 hover:bg-gray-50"
                                        onClick={() => navigate(`/admin/companies/${recruiterCompany._id}`)}
                                    >
                                        Edit Company
                                    </Button>
                                    <Button 
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => navigate('/admin/jobs')}
                                    >
                                        View Jobs
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-xl overflow-hidden text-center p-12">
                        <Building size={48} className="text-gray-300 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Company Set Up Yet</h2>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                            As a recruiter, you need to set up your company profile before posting jobs. 
                            This information will be visible to candidates.
                        </p>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => navigate("/admin/companies/create")}
                        >
                            Set Up Your Company
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Companies;