import React, { useEffect, useState } from 'react';
import Navbar from './shared/Navbar';
import HeroSection from './HeroSection';
import CategoryCarousel from './CategoryCarousel';
import LatestJobs from './LatestJobs';
import TestimonialsSection from './TestimonialsSection';
import CompanyLogosSection from './CompanyLogosSection';
import CounterSection from './CounterSection';
import Footer from './shared/Footer';
import useGetAllJobs from '@/hooks/useGetAllJobs';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Element, scroller } from 'react-scroll';
import { motion } from 'framer-motion';

const Home = () => {
  const { user } = useSelector(store => store.auth);
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  useGetAllJobs();

  const scrollToSection = (section) => {
    scroller.scrollTo(section, {
      duration: 800,
      delay: 0,
      smooth: 'easeInOutQuart'
    });
  };

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

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gradient-to-b from-white to-blue-50">
      {/* Navbar wrapper with fixed positioning */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-md bg-white/90' : 'bg-white/60'}`}>
        <Navbar />
      </div>
      
      {/* Main content with padding to account for fixed navbar */}
      <div className="pt-16">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="w-full"
        >
          <Element name="hero" className="w-full">
            <HeroSection />
          </Element>
          
          {/* Only show CategoryCarousel and LatestJobs if user is not a recruiter */}
          {(!user || user?.role !== "recruiter") && (
            <>
              <Element name="categories" className="w-full">
                <motion.div variants={itemVariants}>
                  <CategoryCarousel />
                </motion.div>
              </Element>
              
              <Element name="latest-jobs" className="w-full">
                <motion.div variants={itemVariants}>
                  <LatestJobs />
                </motion.div>
              </Element>
            </>
          )}
          
          <Element name="counter-stats" className="w-full">
            <motion.div variants={itemVariants}>
              <CounterSection />
            </motion.div>
          </Element>
          
          <Element name="trusted-companies" className="w-full">
            <motion.div variants={itemVariants}>
              <CompanyLogosSection />
            </motion.div>
          </Element>
          
          <Element name="testimonials" className="w-full">
            <motion.div variants={itemVariants}>
              <TestimonialsSection />
            </motion.div>
          </Element>
          
          <Element name="footer" className="w-full">
            <Footer />
          </Element>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;