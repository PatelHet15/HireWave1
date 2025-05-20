import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import logo from '../../assets/images/logo2.png';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Send, 
  User, 
  Briefcase, 
  HelpCircle,
  Loader2,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    userType: 'job-seeker' // Default value
  });
  
  const [loading, setLoading] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validate form fields
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields");
      setLoading(false);
      return;
    }
    
    // Simulate API call
    try {
      // In a real app, you would send the form data to your backend
      // await axios.post('/api/contact', formData);
      
      // Simulating API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        userType: 'job-seeker'
      });
    } catch (error) {
      toast.error("Failed to send your message. Please try again later.");
      console.error("Error sending contact form:", error);
    } finally {
      setLoading(false);
    }
  };
  
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
              Contact <span className="text-blue-600">Us</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Have questions or feedback? We'd love to hear from you.
            </p>
          </motion.div>
        </motion.div>
        
        {/* Contact Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16">
          {/* Contact Information */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-1"
          >
            <motion.div variants={fadeIn} className="bg-white rounded-xl shadow-sm p-8 border border-blue-100 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Get in Touch</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Our Location</h3>
                    <p className="text-gray-600">123 Wave Street, San Francisco, CA 94107, United States</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Email Us</h3>
                    <p className="text-gray-600">support@hirewave.com</p>
                    <p className="text-gray-600">careers@hirewave.com</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 mb-1">Call Us</h3>
                    <p className="text-gray-600">+1 (123) 456-7890</p>
                    <p className="text-gray-600">Monday - Friday, 9AM - 6PM PST</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-blue-600 rounded-xl shadow-sm p-8 text-white">
              <h2 className="text-2xl font-semibold mb-4">Office Hours</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>Closed</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-blue-500">
                <h3 className="font-medium mb-2">Need immediate assistance?</h3>
                <p className="text-blue-100 text-sm">
                  Our support team is available during business hours. 
                  For urgent inquiries, please call our support line.
                </p>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Contact Form */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="lg:col-span-2"
          >
            <motion.div variants={fadeIn} className="bg-white rounded-xl shadow-sm p-8 border border-blue-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Send Us a Message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="pl-10 w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Your Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="pl-10 w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HelpCircle className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="pl-10 w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="How can we help?"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    I am a:
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="job-seeker"
                        checked={formData.userType === 'job-seeker'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Job Seeker</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="employer"
                        checked={formData.userType === 'employer'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Employer</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="userType"
                        value="other"
                        checked={formData.userType === 'other'}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-gray-700">Other</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message *
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <MessageSquare className="h-5 w-5 text-gray-400" />
                    </div>
                    <textarea
                      id="message"
                      name="message"
                      rows="6"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="pl-10 w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your message here..."
                    ></textarea>
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 px-4 flex items-center justify-center gap-2 rounded-lg text-white font-medium transition-colors ${
                      loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Map Section */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold text-center mb-8 text-gray-900">
            Our <span className="text-blue-600">Locations</span>
          </motion.h2>
          
          <motion.div variants={fadeIn} className="rounded-xl overflow-hidden shadow-lg border border-blue-100">
            <div className="aspect-video w-full h-[500px]">
              {/* Google Maps Direct Embed */}
              <div className="relative w-full h-full">
                {/* Real iframe Google Map */}
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.0968143067466!2d-122.4031831!3d37.7890924!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzfCsDQ3JzIwLjciTiAxMjLCsDI0JzExLjUiVw!5e0!3m2!1sen!2sus!4v1623446082922!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="HireWave Headquarters Location"
                  className="absolute inset-0"
                ></iframe>
                
                {/* Location Card - Over the map */}
                <motion.div 
                  className="absolute left-4 md:left-8 top-4 max-w-xs w-72 z-20"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                >
                  <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Card Header */}
                    <div className="px-4 py-3 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-800">HireWave Headquarters</h3>
                      <p className="text-sm text-gray-600">Corporate Office in San Francisco</p>
                    </div>
                    
                    {/* Card Content */}
                    <div className="px-4 py-3">
                      <p className="text-sm text-gray-700 mb-2">123 Wave Street, San Francisco, CA 94107, United States</p>
                      <div className="flex items-center text-sm text-blue-600 mb-3">
                        <Clock className="h-4 w-4 mr-1.5" />
                        <span>Open · 9AM–6PM</span>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <a 
                          href="https://www.google.com/maps/dir//37.7890924,-122.4031831/@37.789092,-122.403183,17z" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 text-sm bg-blue-600 text-white py-1.5 px-3 rounded-full hover:bg-blue-700 transition-colors text-center"
                        >
                          Directions
                        </a>
                        <button className="flex-1 text-sm bg-gray-100 text-gray-700 py-1.5 px-3 rounded-full hover:bg-gray-200 transition-colors">
                          Save
                        </button>
                      </div>
                      
                      <div className="text-sm text-gray-700">
                        <a href="tel:+11234567890" className="flex items-center py-1 hover:text-blue-600">
                          <Phone className="h-4 w-4 mr-4" />
                          +1 (123) 456-7890
                        </a>
                        <a href="mailto:support@hirewave.com" className="flex items-center py-1 hover:text-blue-600">
                          <Mail className="h-4 w-4 mr-4" />
                          support@hirewave.com  
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        {/* FAQ Section */}
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="mb-16"
        >
          <motion.h2 variants={fadeIn} className="text-3xl font-bold text-center mb-8 text-gray-900">
            Frequently <span className="text-blue-600">Asked Questions</span>
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                How can I post a job on HireWave?
              </h3>
              <p className="text-gray-600">
                To post a job, you need to create an employer account. Once registered, navigate to your dashboard 
                and click on "Post a New Job." Follow the prompts to create your job listing.
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Is HireWave free for job seekers?
              </h3>
              <p className="text-gray-600">
                Yes, HireWave is completely free for job seekers. You can create an account, browse jobs, 
                set up job alerts, and apply to positions without any cost.
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                How long does a job posting remain active?
              </h3>
              <p className="text-gray-600">
                Standard job postings remain active for 30 days. Premium listings can be extended 
                for up to 60 days. You can always renew your posting if needed.
              </p>
            </motion.div>
            
            <motion.div variants={fadeIn} className="bg-white p-6 rounded-xl shadow-sm border border-blue-100">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">
                Can I get a refund if I'm not satisfied?
              </h3>
              <p className="text-gray-600">
                We offer a 7-day money-back guarantee for our premium employer services. If you're not 
                satisfied, please contact our support team within 7 days of your purchase.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ContactUs; 