import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { Quote, Star, StarHalf, ChevronRight, ArrowLeft, ArrowRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Michael Johnson",
    position: "Software Engineer",
    company: "TechGlobal Inc.",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    quote: "HireWave transformed my job search experience. I found my dream role within weeks! The interface is intuitive and the matching algorithm is spot-on.",
    rating: 5
  },
  {
    id: 2,
    name: "Sarah Williams",
    position: "UX Designer",
    company: "Creative Labs",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
    quote: "As someone in the creative field, I was struggling to find the right opportunities. HireWave not only connected me with great companies but also helped me showcase my portfolio effectively.",
    rating: 5
  },
  {
    id: 3,
    name: "David Chen",
    position: "Data Scientist",
    company: "DataMinds",
    avatar: "https://randomuser.me/api/portraits/men/75.jpg",
    quote: "The specialized filters for tech roles made job searching incredibly efficient. Found my perfect data science position at a startup that aligns with my values.",
    rating: 4
  },
  {
    id: 4,
    name: "Priya Sharma",
    position: "Marketing Manager",
    company: "Global Brands",
    avatar: "https://randomuser.me/api/portraits/women/65.jpg",
    quote: "HireWave's company insights helped me make informed decisions. I appreciated the transparent salary information and company culture details before applying.",
    rating: 5
  },
  {
    id: 5,
    name: "James Wilson",
    position: "Frontend Developer",
    company: "WebSolutions",
    avatar: "https://randomuser.me/api/portraits/men/52.jpg",
    quote: "I've used many job portals, but HireWave stands out with its clean interface and personalized job recommendations. The application tracking feature is a game-changer!",
    rating: 5
  },
  {
    id: 6,
    name: "Lisa Rodriguez",
    position: "HR Specialist",
    company: "TalentForce",
    avatar: "https://randomuser.me/api/portraits/women/28.jpg",
    quote: "As an HR professional, I switched to HireWave for our company's hiring needs. The quality of candidates and the streamlined process have saved us countless hours.",
    rating: 4
  }
];

const TestimonialsSection = () => {
  const controls = useAnimation();
  const [ref, inView] = useInView({ threshold: 0.2, triggerOnce: true });
  
  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }
  };

  const RenderStars = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => {
          // For full stars
          if (index < Math.floor(rating)) {
            return (
              <Star 
                key={index}
                className="w-4 h-4 text-yellow-400 fill-yellow-400"
              />
            );
          } 
          // For half stars
          else if (index === Math.floor(rating) && rating % 1 !== 0) {
            return (
              <StarHalf 
                key={index}
                className="w-4 h-4 text-yellow-400 fill-yellow-400"
              />
            );
          }
          // For empty stars
          else {
            return (
              <Star 
                key={index}
                className="w-4 h-4 text-gray-300"
              />
            );
          }
        })}
      </div>
    );
  };

  return (
    <motion.div 
      className="relative bg-gradient-to-b from-white to-blue-50 py-20"
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={containerVariants}
    >
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-40 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div 
          className="text-center mb-16 relative"
          variants={itemVariants}
        >
          <h2 className="text-4xl md:text-5xl font-bold relative inline-block">
            What Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Users</span> Say
            <div className="absolute -z-10 -bottom-2 left-0 right-0 h-3 bg-blue-100 transform -rotate-1"></div>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mt-6">
            Hear from professionals who found their dream careers through our platform
          </p>
        </motion.div>

        <motion.div variants={itemVariants} className="relative">
          <Carousel className="w-full">
            <CarouselContent className="-ml-4 md:-ml-6">
              {testimonials.map((testimonial) => (
                <CarouselItem key={testimonial.id} className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3">
                  <motion.div 
                    className="testimonial-card relative overflow-hidden h-full z-0 rounded-xl"
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  >
                    {/* Card with reveal hover effect */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 h-full flex flex-col relative p-7 z-0 overflow-hidden">
                      {/* Go corner arrow element */}
                      <div className="go-corner">
                        <div className="go-arrow">
                          <ChevronRight size={16} />
                        </div>
                      </div>
                      
                      <div className="quote-icon">
                        <Quote className="h-10 w-10 text-blue-100 rotate-180" />
                      </div>
                      
                      <p className="testimonial-text text-gray-700 relative mb-6 mt-6 leading-relaxed flex-grow text-base">"{testimonial.quote}"</p>
                      
                      <div className="flex items-center mt-auto pt-5 border-t border-gray-100 relative">
                        <Avatar className="h-12 w-12 ring-2 ring-white shadow-sm">
                          <AvatarImage src={testimonial.avatar} alt={testimonial.name} />
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="testimonial-name font-semibold text-gray-800 text-sm">{testimonial.name}</p>
                          <p className="testimonial-position text-xs text-blue-600 mb-1">{testimonial.position}, {testimonial.company}</p>
                          <RenderStars rating={testimonial.rating} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Custom navigation buttons */}
            <div className="flex justify-center mt-10 gap-4">
              <CarouselPrevious className="relative inset-auto hover:bg-blue-50 hover:text-blue-600 border-blue-100 h-10 w-10 rounded-full transition-all duration-300 carousel-nav-button prev-button" />
              <CarouselNext className="relative inset-auto hover:bg-blue-50 hover:text-blue-600 border-blue-100 h-10 w-10 rounded-full transition-all duration-300 carousel-nav-button next-button" />
            </div>
          </Carousel>
        </motion.div>
      </div>

      {/* CSS for radial reveal hover effect (variation of card1) */}
      <style jsx>{`
        .testimonial-card {
          transition: all 0.3s ease-out;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }
        
        .testimonial-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .testimonial-card > div {
          z-index: 0;
        }
        
        /* This is the radial reveal/expansion effect */
        .testimonial-card > div:before {
          content: "";
          position: absolute;
          z-index: -1;
          top: -16px;
          right: -16px;
          background: linear-gradient(135deg, #3b82f6, #4f46e5); /* Blue to indigo gradient */
          height: 32px;
          width: 32px;
          border-radius: 32px;
          transform: scale(1);
          transform-origin: 50% 50%;
          transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          opacity: 0.85;
        }
        
        .testimonial-card:hover > div:before {
          transform: scale(30);
        }
        
        .testimonial-card:hover .testimonial-text,
        .testimonial-card:hover .testimonial-name,
        .testimonial-card:hover .testimonial-position {
          transition: all 0.3s ease-out;
          color: rgba(255, 255, 255, 0.95);
        }
        
        .go-corner {
          display: flex;
          align-items: center;
          justify-content: center;
          position: absolute;
          width: 28px;
          height: 28px;
          overflow: hidden;
          top: 0;
          right: 0;
          background: linear-gradient(135deg, #3b82f6, #4f46e5); /* Blue to indigo gradient */
          border-radius: 0 4px 0 28px;
          z-index: 1;
          opacity: 0.9;
          transition: all 0.25s ease;
        }
        
        .testimonial-card:hover .go-corner {
          width: 32px;
          height: 32px;
          border-radius: 0 4px 0 32px;
        }
        
        .go-arrow {
          color: white;
          margin-top: -4px;
          margin-right: -4px;
        }
        
        .quote-icon {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          transition: all 0.3s ease;
        }
        
        .testimonial-card:hover .quote-icon {
          opacity: 0.7;
          transform: scale(1.1);
        }
        
        /* Custom carousel navigation styling */
        .carousel-nav-button {
          transition: transform 0.2s ease;
        }
        
        .carousel-nav-button:hover {
          transform: scale(1.1);
        }
        
        .prev-button:active {
          transform: scale(0.95) translateX(-2px);
        }
        
        .next-button:active {
          transform: scale(0.95) translateX(2px);
        }
      `}</style>
    </motion.div>
  );
};

export default TestimonialsSection; 