import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import logo from '../../assets/images/logo2.png';
import { motion } from 'framer-motion';
import { CheckCircle, Award, Users, Clock, Building, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const teamMembers = [
    { 
      name: "Sarah Johnson", 
      role: "Chief Executive Officer", 
      bio: "With over 15 years of experience in HR technology, Sarah leads our mission to connect talent with opportunity.",
      image: "https://randomuser.me/api/portraits/women/32.jpg"
    },
    { 
      name: "Michael Chen", 
      role: "CTO", 
      bio: "Michael brings 12 years of tech leadership to HireWave, focusing on creating seamless user experiences.",
      image: "https://randomuser.me/api/portraits/men/74.jpg"
    },
    { 
      name: "Aisha Patel", 
      role: "Head of Talent Acquisition", 
      bio: "Aisha's background in recruiting gives her unique insights into both employer and job seeker needs.",
      image: "https://randomuser.me/api/portraits/women/45.jpg"
    },
    { 
      name: "James Wilson", 
      role: "Product Manager", 
      bio: "James works closely with our development team to ensure HireWave meets the evolving needs of our users.",
      image: "https://randomuser.me/api/portraits/men/54.jpg"
    }
  ];

  return (
    <div className="bg-gradient-to-b from-white to-blue-50 min-h-screen">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="text-center mb-16"
        >
          <motion.div variants={fadeIn} className="mb-6">
            <img src={logo} alt="HireWave Logo" className="h-20 mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              About <span className="text-blue-600">HireWave</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Connecting talented professionals with innovative companies since 2020
            </p>
          </motion.div>
          
          <motion.div 
            variants={fadeIn}
            className="bg-white shadow-md rounded-xl p-8 border border-blue-100"
          >
            <p className="text-lg text-gray-700 leading-relaxed">
              HireWave was founded with a simple mission: to transform the job search experience by creating 
              meaningful connections between employers and job seekers. We believe that the right job is more 
              than just a paycheck—it's an opportunity for growth, fulfillment, and positive impact.
            </p>
          </motion.div>
        </motion.div>
        
        {/* Our Mission */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold text-center mb-12 text-gray-900">
            Our <span className="text-blue-600">Mission</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div variants={fadeIn} className="bg-white p-8 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">For Job Seekers</h3>
                  <p className="text-gray-600">
                    We're committed to helping professionals at every career stage find opportunities that match 
                    their skills, values, and aspirations. Our platform provides personalized job recommendations, 
                    career resources, and a streamlined application process.
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-8 rounded-xl shadow-sm border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                  <Building className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-gray-800">For Employers</h3>
                  <p className="text-gray-600">
                    We empower companies to build exceptional teams by connecting them with diverse, qualified candidates. 
                    Our suite of recruitment tools, analytics, and applicant tracking features streamlines the hiring process 
                    from posting to onboarding.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Core Values */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold text-center mb-12 text-gray-900">
            Our <span className="text-blue-600">Core Values</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600 w-fit mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Excellence</h3>
              <p className="text-gray-600">
                We strive for excellence in everything we do, from the technology we build to the service we provide.
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-green-100 rounded-lg text-green-600 w-fit mb-4">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Inclusivity</h3>
              <p className="text-gray-600">
                We believe that diverse teams build better products. We're committed to creating an inclusive platform that serves all job seekers.
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600 w-fit mb-4">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-800">Innovation</h3>
              <p className="text-gray-600">
                We continually evolve our platform with cutting-edge technology to meet the changing needs of the job market.
              </p>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Team Section */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="mb-20"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold text-center mb-12 text-gray-900">
            Our <span className="text-blue-600">Team</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member, index) => (
              <motion.div 
                variants={fadeIn} 
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm border border-blue-100 hover:shadow-md transition-shadow"
              >
                <motion.div 
                  className="overflow-hidden rounded-full mx-auto mb-4"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.2 }}
                >
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-32 h-32 object-cover mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=4f46e5&color=fff&size=200`;
                    }}
                  />
                </motion.div>
                <h3 className="text-xl font-semibold mb-1 text-gray-800 text-center">{member.name}</h3>
                <p className="text-blue-600 text-sm mb-3 text-center">{member.role}</p>
                <p className="text-gray-600 text-sm">{member.bio}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={containerVariants}
          className="bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl p-8 text-white text-center mb-12"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold mb-4">
            Join the HireWave Community
          </motion.h2>
          <motion.p variants={fadeIn} className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're looking for your next career opportunity or building your dream team, 
            HireWave is here to help you succeed.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/jobs" className="bg-white text-blue-600 hover:bg-blue-50 px-6 py-3 rounded-lg font-medium transition-colors">
              Find Jobs
            </Link>
            <Link to="/contact" className="bg-blue-600 text-white border border-white hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 group">
              Contact Us <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default AboutUs; 