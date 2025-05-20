import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import AdminJobsTable from './AdminJobsTable';
import useGetAllAdminJobs from '@/hooks/useGetAllAdminJobs';
import { setSearchJobByText } from '@/Redux/jobSlice';
import { Search, Filter, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Users, LayoutList } from "lucide-react";

const AdminJobs = () => { 
    useGetAllAdminJobs();
    const [input, setInput] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [filterType, setFilterType] = useState("all");
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { allAdminJobs } = useSelector(store => store.job);

    const refreshJobs = () => {
        setIsRefreshing(true);
        // Simulate refresh with timeout
        setTimeout(() => {
            useGetAllAdminJobs();
            setIsRefreshing(false);
        }, 800);
    };

    useEffect(() => {
        dispatch(setSearchJobByText(input));
    }, [input, dispatch]);

    return (
        <div className="bg-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm p-6 mb-6"
                >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Manage Your Jobs</h1>
                            <p className="text-gray-500 mt-1">You have {allAdminJobs.length} active job postings</p>
                        </div>
                        <Button 
                            className="bg-blue-600 hover:bg-blue-700 text-white mt-4 sm:mt-0 flex items-center gap-2"
                            onClick={() => navigate("/admin/jobs/create")}>
                            <Plus size={16} />
                            Post New Job
                        </Button>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <Input
                                className="pl-10 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-200"
                                placeholder="Search jobs by title or company..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-[180px] border-gray-200 bg-gray-50">
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-500" /> 
                                        <SelectValue placeholder="Filter jobs" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Jobs</SelectItem>
                                    <SelectItem value="active">Active Jobs</SelectItem>
                                    <SelectItem value="expired">Expired Jobs</SelectItem>
                                    <SelectItem value="draft">Draft Jobs</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </motion.div>
                
                <AdminJobsTable filterType={filterType} />
            </div>
        </div>
    );
};

export default AdminJobs;