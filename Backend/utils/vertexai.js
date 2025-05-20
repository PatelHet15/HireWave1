// utils/vertexai.js - Implementation for resume analysis using Google's Vertex AI API
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Analyzes resume text using Google's Vertex AI API directly
 * @param {string} resumeText - The text content of the resume
 * @returns {Object} Analysis results with strengths, weaknesses, atsScore, and suggestions
 */
export const analyzeResumeWithVertexAI = async (resumeText) => {
  try {
    console.log('Starting resume analysis with Vertex AI');
    
    // Limit text length to improve performance and stay within API limits
    const truncatedText = resumeText.slice(0, 4000);
    
    // Create a structured prompt for the model
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
    
    // Direct API call to Vertex AI
    console.log('Sending request to Vertex AI API...');
    
    // Prepare the request body for Vertex AI
    const requestBody = {
      instances: [
        {
          prompt: promptText
        }
      ],
      parameters: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topK: 40,
        topP: 0.8
      }
    };
    
    // Make the API call
    const response = await axios.post(
      `https://us-central1-aiplatform.googleapis.com/v1/projects/YOUR_PROJECT_ID/locations/us-central1/publishers/google/models/text-bison:predict`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
        }
      }
    );
    
    console.log('Received response from Vertex AI API');
    const responseText = response.data.predictions[0];
    
    try {
      // Extract the JSON from the response
      let jsonStr = responseText;
      
      // If response contains a JSON code block, extract it
      if (responseText.includes('```json')) {
        jsonStr = responseText.split('```json')[1].split('```')[0].trim();
      } else if (responseText.includes('```')) {
        jsonStr = responseText.split('```')[1].split('```')[0].trim();
      } else if (responseText.startsWith('{') && responseText.endsWith('}')) {
        // Already a JSON string
        jsonStr = responseText;
      } else {
        // Try to find JSON object in the text
        const jsonMatch = responseText.match(/\\{[\\s\\S]*\\}/g);
        if (jsonMatch && jsonMatch.length > 0) {
          jsonStr = jsonMatch[0];
        }
      }
      
      console.log('Extracted JSON from Vertex AI response');
      
      // Parse the JSON response
      const analysis = JSON.parse(jsonStr);
      
      // Ensure the analysis has all required fields
      return {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        atsScore: analysis.atsScore || 70,
        suggestions: analysis.suggestions || []
      };
    } catch (parseError) {
      console.error('Error parsing Vertex AI response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Error in Vertex AI resume analysis:', error);
    
    // Extract skills for a more personalized fallback response
    const extractedSkills = extractKeywords(resumeText);
    console.log('Extracted skills for fallback:', extractedSkills);
    
    // Provide a fallback analysis
    return {
      strengths: [
        'Resume submitted successfully',
        'Information provided in structured format',
        extractedSkills.length > 0 ? `Skills include ${extractedSkills.join(', ')}` : 'Basic qualifications included'
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
};

/**
 * Extract keywords from resume text
 * @param {string} text - The resume text
 * @returns {Array} Array of extracted keywords
 */
function extractKeywords(text) {
  // Normalize text for analysis
  const normalizedText = text.toLowerCase();
  
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
  
  // Extract skills
  const extractedSkills = [];
  skillKeywords.forEach(skill => {
    if (normalizedText.includes(skill)) {
      extractedSkills.push(skill);
    }
  });
  
  return extractedSkills;
}

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
    
    // For PDF parsing, we'll use the pdf-parse library
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
    text = text.replace(/\\s+/g, ' ').trim(); // Normalize whitespace
    
    return text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return 'Error extracting text from PDF. Please check the PDF file format or try uploading again.';
  }
};
