import React, { useState, useEffect } from 'react';
import Navbar from '../shared/Navbar';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import { setSingleCompany } from '@/Redux/companySlice';
import { motion } from 'framer-motion';
import { Building, Loader2, UploadCloud } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import useGetRecruiterCompany from '@/hooks/useGetRecruiterCompany';

const CompanyCreate = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    
    // Fetch the recruiter's company to check if they already have one
    useGetRecruiterCompany();
    
    const { hasCompany, recruiterCompany } = useSelector(store => store.company);
    const [formData, setFormData] = useState({
        companyName: '',
        aboutCompany: '',
        website: '',
        location: '',
        logo: null
    });
    const [loading, setLoading] = useState(false);
    const [previewLogo, setPreviewLogo] = useState(null);

    // Redirect if recruiter already has a company
    useEffect(() => {
        if (hasCompany && recruiterCompany?._id) {
            toast.info("You already have a company set up");
            navigate(`/admin/companies/${recruiterCompany._id}`);
        }
    }, [hasCompany, recruiterCompany?._id, navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size exceeds 5MB limit");
                return;
            }
            setFormData(prev => ({
                ...prev,
                logo: file
            }));
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const registerNewCompany = async (e) => {
        e.preventDefault();
        
        if (!formData.companyName.trim()) {
            toast.error("Company name is required");
            return;
        }
        
        try {
            setLoading(true);
            const companyFormData = new FormData();
            companyFormData.append("companyName", formData.companyName);
            
            if (formData.aboutCompany) {
                companyFormData.append("aboutCompany", formData.aboutCompany);
            }
            
            if (formData.website) {
                companyFormData.append("website", formData.website);
            }
            
            if (formData.location) {
                companyFormData.append("location", formData.location);
            }
            
            if (formData.logo) {
                companyFormData.append("file", formData.logo);
            }
            
            const res = await axios.post(`${COMPANY_API_END_POINT}/register`, companyFormData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(localStorage.getItem('token') && {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    })
                },
                withCredentials: true
            });
            
            if (res?.data?.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message);
                const companyId = res?.data?.company?._id;
                navigate(`/admin/companies/${companyId}`);
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-3xl mx-auto py-12 px-6">
                <motion.div 
                    className="bg-white rounded-xl shadow-2xl p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                >
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Create Your Company</h1>
                        <p className="text-gray-500 mt-2">Set up your company profile to start posting jobs.</p>
                    </div>
                    
                    <form onSubmit={registerNewCompany}>
                        {/* Logo Upload Section */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="relative w-28 h-28 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                {previewLogo ? (
                                    <img 
                                        src={previewLogo} 
                                        alt="Company Logo"
                                        className="w-full h-full object-contain" 
                                    />
                                ) : (
                                    <Building size={36} className="text-gray-300" />
                                )}
                                <label
                                    htmlFor="company-logo"
                                    className="absolute bottom-2 right-2 bg-blue-600 p-1.5 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
                                >
                                    <UploadCloud className="w-4 h-4 text-white" />
                                </label>
                            </div>
                            <input
                                id="company-logo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                            <p className="mt-2 text-xs text-gray-500">Upload company logo (max 5MB)</p>
                        </div>
                        
                        <div className="space-y-5">
                            <div>
                                <Label htmlFor="companyName" className="text-gray-700 font-medium">Company Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="e.g. Acme Corporation"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            <div>
                                <Label htmlFor="aboutCompany" className="text-gray-700 font-medium">About Company</Label>
                                <Textarea
                                    id="aboutCompany"
                                    name="aboutCompany"
                                    className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-24"
                                    placeholder="Describe your company..."
                                    value={formData.aboutCompany}
                                    onChange={handleInputChange}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <Label htmlFor="website" className="text-gray-700 font-medium">Website</Label>
                                    <Input
                                        id="website"
                                        name="website"
                                        type="url"
                                        className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        placeholder="e.g. https://www.example.com"
                                        value={formData.website}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                                    <Input
                                        id="location"
                                        name="location"
                                        type="text"
                                        className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        placeholder="e.g. New York, NY"
                                        value={formData.location}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-8">
                            <Button 
                                type="button"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-100 flex-1"
                                onClick={() => navigate("/admin/companies")}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit"
                                className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                                disabled={loading || !formData.companyName.trim()}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Company"
                                )}
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default CompanyCreate;
