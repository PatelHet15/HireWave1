import React, { useEffect, useState } from 'react';
import Navbar from '../shared/Navbar';
import { Button } from '../ui/button';
import { ArrowLeft, Building, Loader2, UploadCloud } from 'lucide-react';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import axios from 'axios';
import { COMPANY_API_END_POINT } from '@/utils/constant';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useDispatch, useSelector } from 'react-redux';
import useGetCompanyById from '@/hooks/useGetCompanyById';
import { motion } from 'framer-motion';
import { setSingleCompany } from '@/Redux/companySlice';

const CompanySetup = () => {
    const params = useParams();
    // Only use the hook without additional fetching
    useGetCompanyById(params.id);
    const dispatch = useDispatch();
    const [formData, setFormData] = useState({
        name: "",
        aboutCompany: "",
        website: "",
        location: "",
        // industry: "",
        // employeeCount: "",
        file: null
    });
    const { recruiterCompany } = useSelector(store => store.company);
    const [loading, setLoading] = useState(false);
    const [previewLogo, setPreviewLogo] = useState(null);
    const navigate = useNavigate();

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
                file: file
            }));
            setPreviewLogo(URL.createObjectURL(file));
        }
    };

    const submitHandler = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Company name is required");
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append("name", formData.name);
        formDataToSend.append("aboutCompany", formData.aboutCompany);
        formDataToSend.append("website", formData.website);
        formDataToSend.append("location", formData.location);
        
        // if (formData.industry) {
        //     formDataToSend.append("industry", formData.industry);
        // }
        
        // if (formData.employeeCount) {
        //     formDataToSend.append("employeeCount", formData.employeeCount);
        // }
        
        if (formData.file) {
            formDataToSend.append("profilePhoto", formData.file);
        }
        
        try {
            setLoading(true);
            const res = await axios.put(`${COMPANY_API_END_POINT}/update/${params.id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                withCredentials: true
            });
            
            if (res.data.success) {
                dispatch(setSingleCompany(res.data.company));
                toast.success(res.data.message || "Company updated successfully");
                navigate("/admin/companies");
            }
        } catch (error) {
            console.log(error);
            toast.error(error.response?.data?.message || "Failed to update company");
        } finally {
            setLoading(false);
        }
    };

    // No direct fetch function to avoid constant reloading
    
    useEffect(() => {
        if (recruiterCompany) {
            setFormData({
                name: recruiterCompany.name || "",
                aboutCompany: recruiterCompany.aboutCompany || "",
                website: recruiterCompany.website || "",
                location: recruiterCompany.location || "",
                // industry: recruiterCompany.industry || "",
                // employeeCount: recruiterCompany.employeeCount || "",
                file: null
            });
            setPreviewLogo(recruiterCompany.logo || null);
        }
    }, [recruiterCompany]);

    // Animation variants
    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-gray-50 min-h-screen">
            <Navbar />
            <div className="max-w-4xl mx-auto py-10 px-4">
                <motion.div
                    className="bg-white rounded-xl shadow-2xl overflow-hidden"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="p-8">
                        <div className="flex items-center justify-between mb-8">
                            <Button
                                onClick={() => navigate("/admin/companies")}
                                variant="outline"
                                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 border-gray-300 hover:border-blue-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                <span>Back to Company</span>
                            </Button>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Company</h1>
                        </div>

                        <form onSubmit={submitHandler}>
                            {/* Logo Upload Section */}
                            <div className="flex flex-col items-center mb-8">
                                <div className="relative w-28 h-28 rounded-xl border-2 border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center">
                                    {previewLogo ? (
                                        <img
                                            src={previewLogo}
                                            alt="Company Logo"
                                            className="w-full h-full object-contain"
                                            onError={(e) => {
                                                e.target.onerror = null; 
                                                e.target.src = "/src/assets/logo.png";
                                            }}
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

                            {/* Form Fields */}
                            <div className="space-y-5">
                                <div>
                                    <Label htmlFor="name" className="text-gray-700 font-medium">Company Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        required
                                    />
                                </div>
                                
                                <div>
                                    <Label htmlFor="aboutCompany" className="text-gray-700 font-medium">About Company</Label>
                                    <Textarea
                                        id="aboutCompany"
                                        name="aboutCompany"
                                        value={formData.aboutCompany}
                                        onChange={handleInputChange}
                                        className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-24"
                                        placeholder="Describe your company mission, culture and values..."
                                    />
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <Label htmlFor="website" className="text-gray-700 font-medium">Website</Label>
                                        <Input
                                            id="website"
                                            type="url"
                                            name="website"
                                            value={formData.website}
                                            onChange={handleInputChange}
                                            className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="e.g. https://www.example.com"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                                        <Input
                                            id="location"
                                            type="text"
                                            name="location"
                                            value={formData.location}
                                            onChange={handleInputChange}
                                            className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="e.g. New York, NY"
                                        />
                                    </div>
                                </div>
                                
                                {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    <div>
                                        <Label htmlFor="industry" className="text-gray-700 font-medium">Industry</Label>
                                        <Input
                                            id="industry"
                                            type="text"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleInputChange}
                                            className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="e.g. Technology, Finance, Healthcare"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="employeeCount" className="text-gray-700 font-medium">Company Size</Label>
                                        <Input
                                            id="employeeCount"
                                            type="text"
                                            name="employeeCount"
                                            value={formData.employeeCount}
                                            onChange={handleInputChange}
                                            className="mt-2 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                            placeholder="e.g. 10-50 employees"
                                        />
                                    </div>
                                </div> */}
                            </div>

                            {/* Submit Button */}
                            <div className="mt-8">
                                {loading ? (
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" disabled>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        Save Changes
                                    </Button>
                                )}
                            </div>
                        </form>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default CompanySetup;