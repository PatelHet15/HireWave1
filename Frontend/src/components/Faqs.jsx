import React, { useState } from "react";
// Import the Navbar component
import { ChevronDown, ChevronUp } from "lucide-react";
import Navbar from "./shared/Navbar";
import Footer from "./shared/Footer";

const faqs = [
  {
    category: "General Questions",
    questions: [
      {
        q: "What is this platform about?",
        a: "Our job portal connects job seekers with top companies, providing a seamless way to find jobs, apply, and manage applications while helping recruiters hire the best talent efficiently.",
      },
      {
        q: "Is this platform free to use?",
        a: "Yes! Job seekers can browse and apply for jobs for free. Recruiters may have different plans based on hiring needs.",
      },
      {
        q: "How do I create an account?",
        a: "Click on the 'Sign Up' button, choose whether you are a 'Job Seeker' or 'Recruiter,' and follow the steps to complete your registration.",
      },
      {
        q: "Can I apply for jobs without signing up?",
        a: "No, you need to create an account to apply for jobs and track your applications.",
      },
    ],
  },
  {
    category: "For Job Seekers",
    questions: [
      {
        q: "How do I search for jobs?",
        a: "Use the 'Search' bar to find jobs by title, company, or location. You can also use filters like salary, experience level, and job type.",
      },
      {
        q: "How do I apply for a job?",
        a: "Once you find a job, click on the 'Apply Now' button. Some companies may require you to upload a resume or fill out additional details.",
      },
      {
        q: "How do I track my applications?",
        a: "Go to your 'Profile' > 'My Applications' to see the status of all jobs you’ve applied for.",
      },
      {
        q: "Can I edit or withdraw my application after submission?",
        a: "It depends on the recruiter's settings. If allowed, you can withdraw or update your application under 'My Applications'.",
      },
    ],
  },
  {
    category: "For Recruiters",
    questions: [
      {
        q: "How do I post a job?",
        a: "Log in to your 'Recruiter Dashboard,' click on 'Post a Job,' fill in job details, and publish. Your job will be visible to all job seekers.",
      },
      {
        q: "How can I manage applications?",
        a: "Go to 'Dashboard' > 'Manage Jobs' to view all applicants, filter by qualifications, and shortlist candidates.",
      },
      {
        q: "Can I contact applicants directly?",
        a: "Yes, you can message applicants through the 'Message' feature or view their contact details on their profile.",
      },
      {
        q: "How do I edit or close a job posting?",
        a: "In the 'Manage Jobs' section, click 'Edit' to update job details or 'Close' to stop receiving applications.",
      },
    ],
  },
  {
    category: "Technical & Support",
    questions: [
      {
        q: "The website is not working properly. What should I do?",
        a: "Try clearing your browser cache, using a different browser, or contacting our 'Support Team'.",
      },
      {
        q: "How do I contact support?",
        a: "Go to the 'Contact Us' page or email us at 'support@yourjobportal.com'.",
      },
    ],
  },
];

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleQuestion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      <div className="max-w-5xl px-20 py-10 text-left">
        <h1 className="text-3xl font-bold text-left text-blue-600 mb-10">
          Frequently Asked Questions
        </h1>
        {faqs.map((section, sectionIndex) => (
          <div key={sectionIndex} className="mb-10">
            <h2 className="text-xl font-semibold text-gray-700 mb-4 border-l-4 border-blue-500 pl-3">
              {section.category}
            </h2>
            <div className="space-y-4">
              {section.questions.map((item, i) => {
                const index = `${sectionIndex}-${i}`;
                return (
                  <div
                    key={index}
                    className="bg-blue-50 border border-blue-200 p-5 rounded-lg shadow-md"
                  >
                    <button
                      className="w-full flex justify-between items-center text-md font-medium text-blue-700 focus:outline-none"
                      onClick={() => toggleQuestion(index)}
                    >
                      {item.q}
                      {openIndex === index ? (
                        <ChevronUp className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      )}
                    </button>
                    {openIndex === index && (
                      <p className="text-gray-700 mt-3">{item.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <Footer/>
    </div>
  );
};

export default FAQs;
