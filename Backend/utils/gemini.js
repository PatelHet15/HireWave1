// utils/gemini.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';

/**
 * Extract keywords from resume text
 * @param {string} text - The resume text
 * @returns {Array} Array of extracted keywords with their types
 */
function extractKeywords(text) {
  // List of common technical skills to look for
  const skillKeywords = [
    'javascript', 'react', 'node', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'swift',
    'kotlin', 'html', 'css', 'sql', 'nosql', 'mongodb', 'mysql', 'postgresql', 'oracle',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'git', 'github', 'gitlab',
    'agile', 'scrum', 'kanban', 'jira', 'confluence', 'leadership', 'management', 'teamwork',
    'communication', 'problem-solving', 'analytical', 'critical thinking', 'creativity',
    'time management', 'project management', 'product management', 'marketing', 'sales',
    'customer service', 'data analysis', 'machine learning', 'ai', 'artificial intelligence',
    'deep learning', 'nlp', 'natural language processing', 'computer vision', 'blockchain',
    'cybersecurity', 'networking', 'cloud computing', 'devops', 'sre', 'site reliability',
    'full stack', 'frontend', 'backend', 'mobile', 'ios', 'android', 'react native', 'flutter'
  ];
  
  // List of common education keywords
  const educationKeywords = [
    'degree', 'bachelor', 'master', 'phd', 'diploma', 'certificate', 'university', 'college',
    'school', 'education', 'graduated', 'major', 'minor', 'gpa', 'honors', 'cum laude'
  ];
  
  // List of common experience keywords
  const experienceKeywords = [
    'experience', 'work', 'job', 'position', 'role', 'responsibility', 'project', 'achievement',
    'led', 'managed', 'developed', 'created', 'implemented', 'designed', 'coordinated', 'improved'
  ];
  
  // Normalize text for keyword matching
  const normalizedText = text.toLowerCase();
  
  // Extract keywords
  const keywords = [];
  
  // Check for skills
  skillKeywords.forEach(skill => {
    if (normalizedText.includes(skill)) {
      keywords.push({ word: skill, type: 'skill' });
    }
  });
  
  // Check for education
  educationKeywords.forEach(edu => {
    if (normalizedText.includes(edu)) {
      keywords.push({ word: edu, type: 'education' });
    }
  });
  
  // Check for experience
  experienceKeywords.forEach(exp => {
    if (normalizedText.includes(exp)) {
      keywords.push({ word: exp, type: 'experience' });
    }
  });
  
  return keywords;
}

dotenv.config();

// Check for Gemini API key
let apiKeyValid = true;
if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY is missing. Please add it to your .env file');
  apiKeyValid = false;
}

// Log the API key status for debugging
console.log('Gemini API key is valid:', apiKeyValid);

// Initialize the Gemini API client with the correct API key
// Note: Make sure to use a valid API key from https://aistudio.google.com/app/apikey
// Don't specify API version to use the default version which should work with your key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');

/**
 * Analyzes resume text using Google's Gemini API
 * @param {string} resumeText - The text content of the resume
 * @returns {Object} Analysis results with strengths, weaknesses, atsScore, and suggestions
 */
export const analyzeResume = async (resumeText) => {
  try {
    console.log('Starting resume analysis with Gemini');
    
    // Check if API key is valid before proceeding
    if (!apiKeyValid) {
      console.log('Skipping Gemini API call because API key is invalid or missing');
      throw new Error('Invalid or missing Gemini API key');
    }
    
    // Limit text length to improve performance and stay within API limits
    const truncatedText = resumeText.slice(0, 4000);
    
    // Use the standard gemini-pro model which should be available
    console.log('Initializing gemini-pro model');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40
      }
    });
    
    // Create a structured prompt for the model
    // Format the prompt in a way that's compatible with Gemini API
    const promptText = `Analyze the following resume text and provide detailed professional feedback.

RESUME TEXT:
${truncatedText}

Provide your analysis in the following JSON format only, with no additional text or explanation:
{
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "atsScore": number between 0-100,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3", "suggestion4"]
}

Make sure to:
1. Identify 3-5 key strengths of the resume
2. Identify 3-5 areas for improvement
3. Provide an ATS score from 0-100 based on keyword relevance, formatting, and content quality
4. Offer 3-5 specific suggestions for improving the resume

Return ONLY the JSON with no additional text or explanation.`;
    
    // Generate content with the model
    console.log('Sending request to Gemini API...');
    let response;
    try {
      // Use the promptText directly with generateContent
      const result = await model.generateContent(promptText);
      console.log('Received response from Gemini API');
      response = result.response.text();
      console.log('Successfully extracted text from Gemini response');
    } catch (apiError) {
      console.error('Error calling Gemini API:', apiError.message);
      throw new Error(`Gemini API call failed: ${apiError.message}`);
    }
    
    // Extract the JSON from the response
    // Sometimes the model might include markdown code blocks or extra text
    let jsonStr = response;
    
    try {
      // If response contains a JSON code block, extract it
      if (response.includes('```json')) {
        jsonStr = response.split('```json')[1].split('```')[0].trim();
      } else if (response.includes('```')) {
        jsonStr = response.split('```')[1].split('```')[0].trim();
      } else if (response.startsWith('{') && response.endsWith('}')) {
        // Already a JSON string
        jsonStr = response;
      } else {
        // Try to find JSON object in the text
        const jsonMatch = response.match(/\{[\s\S]*\}/g);
        if (jsonMatch && jsonMatch.length > 0) {
          jsonStr = jsonMatch[0];
        }
      }
      
      console.log('Extracted JSON from Gemini response');
      
      // Parse the JSON response
      const analysis = JSON.parse(jsonStr);
      
      // Ensure the analysis has all required fields
      return {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        atsScore: analysis.atsScore || 70,
        suggestions: analysis.suggestions || []
      };
    } catch (error) {
      console.error('Error parsing Gemini response:', error);
      throw error; // Re-throw to be caught by the outer try-catch
    }
  } catch (error) {
    console.error('Error in Gemini resume analysis:', error);
    
    try {
      // Try to extract some keywords from the resume text for a more personalized fallback
      const keywords = extractKeywords(resumeText);
      const skills = keywords.filter(k => k.type === 'skill').map(k => k.word);
      
      console.log('Extracted skills for fallback:', skills);
      
      // Provide a more personalized fallback response
      return {
        strengths: [
          skills.length > 0 ? `Technical skills: ${skills.slice(0, 3).join(', ')}` : 'Professional presentation',
          'Clear presentation of information',
          'Structured format'
        ],
        weaknesses: [
          'Could benefit from more quantifiable achievements', 
          'Consider adding more industry-specific keywords', 
          'Format could be more ATS-friendly'
        ],
        atsScore: Math.min(75, 50 + (skills.length * 2)),
        suggestions: [
          'Add more quantifiable results',
          'Include more keywords from job descriptions',
          'Ensure consistent formatting throughout',
          'Highlight most relevant skills first'
        ]
      };
    } catch (fallbackError) {
      console.error('Error in fallback analysis:', fallbackError);
      
      // Ultimate fallback if even the keyword extraction fails
      return {
        strengths: [
          'Resume submitted successfully',
          'Information provided in structured format',
          'Basic qualifications included'
        ],
        weaknesses: [
          'Could benefit from more specific details', 
          'Consider tailoring to specific job descriptions', 
          'Add more quantifiable achievements'
        ],
        atsScore: 70,
        suggestions: [
          'Add more specific achievements with metrics',
          'Include relevant keywords from job descriptions',
          'Ensure consistent formatting throughout',
          'Highlight your most impressive accomplishments'
        ]
      };
    }
  }
};

/**
 * Extracts text from a PDF file
 * @param {string} pdfUrl - URL to the PDF file
 * @returns {string} Extracted text content
 */
export const extractTextFromPDF = async (pdfUrl) => {
  try {
    // Set a timeout for the axios request to prevent hanging
    const response = await axios.get(pdfUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    
    // For PDF parsing, we'll continue using the existing pdf-parse library
    // This function is kept for compatibility with the existing code
    const pdfParse = (await import('pdf-parse')).default;
    
    // Add options to pdf-parse for faster processing
    const options = {
      max: 50, // Only parse the first 50 pages for speed
      pagerender: function(pageData) {
        return pageData.getTextContent({
          normalizeWhitespace: true,
          disableCombineTextItems: false
        });
      }
    };
    
    const pdfData = await pdfParse(response.data, options);
    
    // Clean and normalize the text
    let text = pdfData.text || '';
    text = text.replace(/\s+/g, ' ').trim(); // Normalize whitespace
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Error extracting text from PDF. Please check the PDF file format or try uploading again.';
  }
};
