import React, { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Users, Briefcase, Building2, Award } from 'lucide-react';

const statsData = [
  { 
    id: 1, 
    icon: <Briefcase className="text-white w-8 h-8" />, 
    value: 15000, 
    label: "Jobs Posted", 
    color: "bg-gradient-to-br from-blue-600 to-blue-700",
    plus: true
  },
  { 
    id: 2, 
    icon: <Users className="text-white w-8 h-8" />, 
    value: 120000, 
    label: "Active Job Seekers", 
    color: "bg-gradient-to-br from-blue-500 to-indigo-600",
    plus: true
  },
  { 
    id: 3, 
    icon: <Building2 className="text-white w-8 h-8" />, 
    value: 5000, 
    label: "Companies Hiring", 
    color: "bg-gradient-to-br from-indigo-500 to-blue-600",
    plus: true
  },
  { 
    id: 4, 
    icon: <Award className="text-white w-8 h-8" />, 
    value: 90, 
    label: "Success Rate", 
    color: "bg-gradient-to-br from-blue-500 to-blue-600",
    percent: true
  }
];

const CounterSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  // State for counter values
  const [counters, setCounters] = useState(statsData.map(() => 0));

  useEffect(() => {
    if (inView) {
      controls.start('visible');
      
      // Animate counters
      const intervals = statsData.map((stat, index) => {
        const duration = 2000; // 2 seconds
        const targetValue = stat.value;
        const framesCount = 60; // 60 frames for smooth animation
        const increment = targetValue / framesCount;
        let currentValue = 0;
        
        return setInterval(() => {
          if (currentValue < targetValue) {
            currentValue += increment;
            if (currentValue > targetValue) currentValue = targetValue;
            
            setCounters(prevCounters => {
              const newCounters = [...prevCounters];
              newCounters[index] = Math.round(currentValue);
              return newCounters;
            });
          } else {
            clearInterval(intervals[index]);
          }
        }, duration / framesCount);
      });
      
      return () => intervals.forEach(interval => clearInterval(interval));
    }
  }, [inView, controls]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { 
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const formatValue = (value) => {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'k';
    }
    return value;
  };

  return (
    <div className="relative bg-transparent py-20">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-40 left-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div
        ref={ref}
        className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10"
        initial="hidden"
        animate={controls}
        variants={containerVariants}
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Numbers</span> That Matter
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Helping professionals and companies connect on a global scale
          </p>
        </motion.div>

        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" variants={containerVariants}>
          {statsData.map((stat, index) => (
            <motion.div
              key={stat.id}
              className="rounded-xl p-6 shadow-lg border border-white/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              style={{
                background: `linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)`,
                backdropFilter: 'blur(8px)'
              }}
            >
              <div className="flex flex-col items-center text-center">
                <div className={`${stat.color} p-4 rounded-full mb-4 shadow-lg`}>
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold tracking-tight text-blue-900">
                  {formatValue(counters[index])}
                  {stat.plus && <span className="text-blue-600">+</span>}
                  {stat.percent && <span className="text-blue-600">%</span>}
                </div>
                <div className="mt-2 text-gray-600 font-medium">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CounterSection; 