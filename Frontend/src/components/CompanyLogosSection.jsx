import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ChevronLeft, ChevronRight, Star, TrendingUp, Globe, Shield, Award, Users, Zap } from 'lucide-react';

// Import logo images
import googleLogo from '../assets/images/google.webp';
import microsoftLogo from '../assets/images/Microsoft.png';
import amazonLogo from '../assets/images/amazon.png';
import appleLogo from '../assets/images/apple.webp';
import metaLogo from '../assets/images/meta.png';
import Netflixlogo from '../assets/images/netflix.jpg'

// Company data with logos and testimonials
const companies = [
  { 
    id: 1,
    name: "Google", 
    logoSrc: googleLogo, 
    industry: "Technology",
    testimonial: "This platform has transformed our hiring process, reducing time-to-hire by 40% while improving candidate quality.",
    author: "Sarah Chen",
    position: "Head of Talent Acquisition"
  },
  { 
    id: 2,
    name: "Microsoft", 
    logoSrc: microsoftLogo, 
    industry: "Software",
    testimonial: "We've found exceptional talent that aligns perfectly with our company culture and technical requirements.",
    author: "Michael Rodriguez",
    position: "VP of Human Resources"
  },
  { 
    id: 3,
    name: "Amazon", 
    logoSrc: amazonLogo, 
    industry: "E-commerce",
    testimonial: "The AI-powered matching has connected us with candidates we might have otherwise overlooked in our traditional hiring process.",
    author: "Jessica Wong",
    position: "Technical Recruiting Lead"
  },
  { 
    id: 4,
    name: "Apple", 
    logoSrc: appleLogo, 
    industry: "Consumer Electronics",
    testimonial: "The platform's intuitive interface and powerful analytics have given us unprecedented insights into our recruitment funnel.",
    author: "David Miller",
    position: "Global Talent Director"
  },
  { 
    id: 5,
    name: "Meta", 
    logoSrc: metaLogo, 
    industry: "Social Media",
    testimonial: "We've been able to build diverse teams faster and more efficiently than ever before using this platform.",
    author: "Priya Patel",
    position: "Diversity & Inclusion Officer"
  }
];

// Statistics about the platform
const statistics = [
  { value: "500+", label: "Enterprise Partners", icon: <Globe className="h-6 w-6 text-blue-500" /> },
  { value: "2.5M+", label: "Talented Professionals", icon: <Users className="h-6 w-6 text-indigo-500" /> },
  { value: "94%", label: "Hiring Success Rate", icon: <TrendingUp className="h-6 w-6 text-green-500" /> },
  { value: "100%", label: "Data Security", icon: <Shield className="h-6 w-6 text-purple-500" /> },
];

const CompanyLogosSection = () => {
  const [ref, inView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [activeTestimonialIndex, setActiveTestimonialIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
        duration: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1.0] }
    }
  };

  // Handle carousel navigation
  const nextTestimonial = () => {
    setActiveTestimonialIndex((prev) => 
      prev === companies.length - 1 ? 0 : prev + 1
    );
  };
  
  const prevTestimonial = () => {
    setActiveTestimonialIndex((prev) => 
      prev === 0 ? companies.length - 1 : prev - 1
    );
  };
  
  // Auto-scroll carousel when not hovering
  useEffect(() => {
    if (isHovering) return;
    
    const interval = setInterval(() => {
      nextTestimonial();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isHovering, activeTestimonialIndex]);
  
  // Get current testimonial
  const activeCompany = companies[activeTestimonialIndex];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={containerVariants}
      className="relative bg-transparent"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 relative z-10">
        {/* Section Header */}
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl font-bold text-blue-900 mb-4">
            Trusted by <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Industry Leaders</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Join the world's most innovative companies using our platform to discover exceptional talent.
          </p>
        </motion.div>

        {/* Auto-scrolling Logos Section */}
        <motion.div 
          className="mb-16 overflow-hidden"
          variants={itemVariants}
        >
          <div className="relative w-full">
            {/* Seamless single row - moves left, duplicated for infinite scroll */}
            <div 
              className="marquee-track flex whitespace-nowrap group"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              style={{ animationPlayState: isHovering ? 'paused' : 'running' }}
            >
              {[...companies, ...companies].map((company, idx) => (
                <div key={`marquee-${company.id}-${idx}`} className="mx-2 flex items-center justify-center">
                  <motion.div 
                    className="bg-white/80 backdrop-blur-sm w-32 h-32 flex items-center justify-center rounded-xl border border-blue-100 shadow-md hover:shadow-lg transition-all duration-300"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    <img 
                      src={company.logoSrc} 
                      alt={company.name} 
                      className="h-16 w-16 object-contain grayscale hover:grayscale-0 transition-all duration-300" 
                    />
                  </motion.div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Testimonial Carousel */}
        <motion.div 
          className="mb-16"
          variants={itemVariants}
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 border border-blue-100">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              {/* Company logo */}
              <div className="w-full md:w-1/3 flex justify-center">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl border border-blue-200">
                  <img 
                    src={activeCompany.logoSrc} 
                    alt={activeCompany.name} 
                    className="h-24 w-auto object-contain mx-auto" 
                  />
                  <p className="text-center mt-4 text-blue-600 font-medium">{activeCompany.industry}</p>
                </div>
              </div>
              
              {/* Testimonial text */}
              <div className="w-full md:w-2/3">
                <div className="mb-6">
                  <svg width="45" height="36" className="text-blue-500 mb-5" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M13.5 0C6.04125 0 0 6.04125 0 13.5C0 20.9588 6.04125 27 13.5 27C20.9588 27 27 20.9588 27 13.5C27 6.04125 20.9588 0 13.5 0ZM40.5 0C33.0412 0 27 6.04125 27 13.5C27 20.9588 33.0412 27 40.5 27C47.9588 27 54 20.9588 54 13.5C54 6.04125 47.9588 0 40.5 0Z" fill="currentColor" fillOpacity="0.25"/>
                  </svg>
                  <p className="text-gray-700 text-xl leading-relaxed italic">"{activeCompany.testimonial}"</p>
                </div>
                <div className="flex items-center">
                  <div className="mr-4 h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {activeCompany.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-gray-900 font-semibold text-lg">{activeCompany.author}</h4>
                    <p className="text-blue-600">{activeCompany.position}, {activeCompany.name}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Navigation controls */}
            <div className="flex justify-center mt-8 gap-3">
              <button 
                onClick={prevTestimonial}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={20} />
              </button>
              
              {/* Pagination indicators */}
              <div className="flex items-center gap-2">
                {companies.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setActiveTestimonialIndex(index)}
                    className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                      index === activeTestimonialIndex 
                        ? 'bg-blue-600 w-6' 
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                onClick={nextTestimonial}
                className="p-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors duration-200"
                aria-label="Next testimonial"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Stats Section with Fade-in Background */}
        <motion.div 
          className="mb-16 relative"
          variants={itemVariants}
        >
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-6 p-8">
            {statistics.map((stat) => (
              <motion.div
                key={stat.label}
                className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-blue-50 hover:border-blue-400 transition-all duration-300"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-50 rounded-lg">
                  {stat.icon}
                </div>
                <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">{stat.value}</h3>
                <p className="text-gray-600 text-center font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Add custom CSS for the marquee animations */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .marquee-track { width: max-content; animation: marquee 30s linear infinite; }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 30s linear infinite;
        }
      `}</style>
    </motion.div>
  );
};

export default CompanyLogosSection;