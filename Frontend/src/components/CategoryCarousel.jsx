import React, { useState, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSearchedQuery } from "@/Redux/jobSlice";
import { Search } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useInView } from "react-intersection-observer";

const categories = [
  {
    title: "Software Engineer",
    icon: "💻",
    gradient: "from-blue-500 to-blue-600",
    textColor: "text-white",
    stats: { openings: "2.5K+", avgSalary: "$120K" },
  },
  {
    title: "Data Scientist",
    icon: "📊",
    gradient: "from-blue-400 to-blue-500",
    textColor: "text-white",
    stats: { openings: "1.8K+", avgSalary: "$135K" },
  },
  {
    title: "AI Engineer",
    icon: "🤖",
    gradient: "from-indigo-500 to-blue-500",
    textColor: "text-white",
    stats: { openings: "1.2K+", avgSalary: "$150K" },
  },
  {
    title: "Full Stack Developer",
    icon: "🌐",
    gradient: "from-blue-600 to-indigo-600",
    textColor: "text-white",
    stats: { openings: "3K+", avgSalary: "$125K" },
  },
  {
    title: "DevOps Engineer",
    icon: "⚙️",
    gradient: "from-blue-500 to-indigo-500",
    textColor: "text-white",
    stats: { openings: "1.5K+", avgSalary: "$140K" },
  },
  {
    title: "UI/UX Designer",
    icon: "🎨",
    gradient: "from-indigo-400 to-blue-500",
    textColor: "text-white",
    stats: { openings: "900+", avgSalary: "$110K" },
  },
];

const CategoryCarousel = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((store) => store.auth);
  const [query, setQuery] = useState("");
  
  const controls = useAnimation();
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const searchJobHandler = (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    const trimmedQuery = searchQuery.trim();
    dispatch(setSearchedQuery(trimmedQuery));
    navigate(`/browse?search=${encodeURIComponent(trimmedQuery)}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchJobHandler(query);
  };

  return (
    <section className="relative bg-transparent py-16">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute top-20 right-10 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>
      
      <motion.div 
        ref={ref}
        initial="hidden"
        animate={controls}
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10"
      >
        <motion.div className="text-center mb-12" variants={itemVariants}>
          <h2 className="text-4xl font-bold text-blue-900">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Top Roles</span>
          </h2>
          <p className="text-gray-600 mt-3 max-w-2xl mx-auto">
            Browse categories and find the role that matches your skills
          </p>
        </motion.div>

        {user && (
          <motion.form
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="mb-12 max-w-3xl mx-auto w-full"
          >
            <div className="flex items-center border border-blue-200 rounded-full overflow-hidden shadow-md hover:shadow-lg transition bg-white/80 backdrop-blur-sm">
              <input
                type="text"
                placeholder="Search job title, company, or location..."
                className="w-full px-5 py-4 text-gray-800 focus:outline-none text-base bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Button
                type="submit"
                className="rounded-none rounded-r-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-6"
              >
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </motion.form>
        )}

        <motion.div variants={itemVariants}>
          <Carousel className="w-full max-w-6xl mx-auto">
            <CarouselContent className="-ml-4 md:-ml-6">
              {categories.map((cat, index) => (
                <CarouselItem
                  key={index}
                  className="pl-4 md:pl-6 md:basis-1/2 lg:basis-1/3"
                >
                  <motion.div
                    whileHover={{ y: -5, transition: { duration: 0.2 } }}
                    onClick={() => searchJobHandler(cat.title)}
                    className={`cursor-pointer bg-gradient-to-br ${cat.gradient} rounded-xl shadow-md p-6 h-full flex flex-col justify-between hover:shadow-lg transition-all duration-300 border border-white/20 backdrop-blur-sm`}
                  >
                    <div>
                      <div className="text-5xl mb-3">{cat.icon}</div>
                      <h3
                        className={`${cat.textColor} text-lg font-semibold mb-1`}
                      >
                        {cat.title}
                      </h3>
                      <p className="text-blue-50 text-sm mb-4">
                        Explore opportunities for {cat.title.toLowerCase()}s
                      </p>
                    </div>
                    <div className="flex justify-between text-sm mb-4 text-white font-medium">
                      <div>
                        <p className="text-xs text-blue-100">Openings</p>
                        <p>{cat.stats.openings}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-100">Avg. Salary</p>
                        <p>{cat.stats.avgSalary}</p>
                      </div>
                    </div>
                    <Button className="w-full bg-white/20 hover:bg-white/30 text-white text-sm backdrop-blur-sm border border-white/30">
                      View Jobs
                    </Button>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-6 hover:bg-blue-100 text-blue-600 bg-white shadow-md" />
            <CarouselNext className="-right-6 hover:bg-blue-100 text-blue-600 bg-white shadow-md" />
          </Carousel>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CategoryCarousel;
