import React, { useEffect, useState } from 'react';
import { Avatar, AvatarImage } from '../ui/avatar';
import { Edit2, MoreHorizontal } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CompaniesTable = () => {
    const { companies, searchCompanyByText } = useSelector(store => store.company);
    const [filterCompany, setFilterCompany] = useState(companies);
    const [expandedDescriptions, setExpandedDescriptions] = useState({});
    const [showDropdown, setShowDropdown] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const filteredCompany = companies.length > 0
            ? companies.filter((company) =>
                !searchCompanyByText || company?.name?.toLowerCase().includes(searchCompanyByText.toLowerCase())
            )
            : [];
        setFilterCompany(filteredCompany);
    }, [companies, searchCompanyByText]);

    // Function to toggle description expansion
    const toggleDescription = (companyId) => {
        setExpandedDescriptions((prev) => ({
            ...prev,
            [companyId]: !prev[companyId],
        }));
    };

    return (
        <div className="p-6">
            {filterCompany.length === 0 ? (
                <div className="text-center py-10 text-gray-600">
                    <p className="text-lg">No companies have been registered yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {filterCompany.map((company) => {
                        const words = company?.aboutCompany ? company.aboutCompany.split(" ") : [];
                        const isExpanded = expandedDescriptions[company._id];
                        const shortText = words.slice(0, 20).join(" ");

                        return (
                            <motion.div
                                key={company._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0, transition: { duration: 0.3 } }}
                                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                                className="bg-white border rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <Avatar className="w-16 h-16 border-2 border-blue-500 rounded-full">
                                            <AvatarImage src={company.logo} alt={company.name} />
                                        </Avatar>
                                        <button
                                            onClick={() => setShowDropdown((prev) => (prev === company._id ? null : company._id))}
                                            className="p-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        {showDropdown === company._id && (
                                            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg">
                                                <button
                                                    onClick={() => navigate(`/admin/companies/${company._id}`)}
                                                    className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    <span>Edit</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="mt-4 text-xl font-bold text-gray-900">{company.name}</h2>
                                    <p className="mt-2 text-sm text-gray-800">
                                        {isExpanded ? company.aboutCompany : `${shortText}...`}
                                    </p>
                                    {words.length > 20 && (
                                        <button
                                            onClick={() => toggleDescription(company._id)}
                                            className="text-blue-600 text-sm font-medium mt-1"
                                        >
                                            {isExpanded ? "Less" : "More"}
                                        </button>
                                    )}
                                    <div className="mt-4 text-sm text-gray-500">
                                        <p><strong>Website:</strong> {company.website || "N/A"}</p>
                                        <p><strong>Location:</strong> {company.location || "N/A"}</p>
                                        <p><strong>Created:</strong> {company.createdAt.split("T")[0]}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default CompaniesTable;
