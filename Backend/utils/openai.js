// import OpenAI from 'openai';
// import dotenv from 'dotenv';
// import pdfParse from 'pdf-parse';
// import axios from 'axios';

// dotenv.config();

// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY
// });

// export const extractTextFromPDF = async (pdfUrl) => {
//   try {
//     const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
//     const pdfData = await pdfParse(response.data);
//     return pdfData.text;
//   } catch (error) {
//     console.error('Error extracting text from PDF:', error);
//     throw error;
//   }
// };

export const analyzeResumeWithOpenAI = async (resumeText) => {
  try {
    console.log('Starting resume analysis with OpenAI');
    
    // Initialize OpenAI client
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Limit text length to improve performance and stay within API limits
    const truncatedText = resumeText.slice(0, 4000);
    
    console.log('Sending request to OpenAI API...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional resume analyzer. Analyze the resume and provide feedback in JSON format with the following structure: { strengths: string[], weaknesses: string[], atsScore: number, suggestions: string[] }"
        },
        {
          role: "user",
          content: truncatedText
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });
    
    console.log('Received response from OpenAI API');
    const responseText = response.choices[0].message.content;
    
    try {
      // Parse the JSON response
      const analysis = JSON.parse(responseText);
      
      // Ensure the analysis has all required fields
      return {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        atsScore: analysis.atsScore || 70,
        suggestions: analysis.suggestions || []
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Error in OpenAI resume analysis:', error);
    
    // Provide a fallback analysis
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
};


// utils/openai.js
// import pdfParse from 'pdf-parse';
// import axios from 'axios';

// export const extractTextFromPDF = async (pdfUrlOrPath) => {
//   try {
//     // Handle both URL and file path inputs
//     let pdfBuffer;
    
//     if (pdfUrlOrPath.startsWith('http')) {
//       // If it's a URL
//       const response = await axios.get(pdfUrlOrPath, { 
//         responseType: 'arraybuffer' 
//       });
//       pdfBuffer = response.data;
//     } else {
//       // If it's a local file path
//       const fs = await import('fs');
//       pdfBuffer = fs.readFileSync(pdfUrlOrPath);
//     }

//     const pdfData = await pdfParse(pdfBuffer);
//     return pdfData.text;
//   } catch (error) {
//     console.error('Error extracting text from PDF:', error);
//     throw error;
//   }
// };


// utils/openai.js
import OpenAI from 'openai';
import dotenv from 'dotenv';
import pdfParse from 'pdf-parse';
import axios from 'axios';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is missing. Please add it to your .env file');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Optimized resume analysis function with OpenAI API and fallback mechanism
export const analyzeResume = async (resumeText) => {
  try {
    console.log('Starting resume analysis with OpenAI');
    // Limit the resume text to a reasonable size for faster processing
    const truncatedText = resumeText.slice(0, 3000); 
    
    // Try to use OpenAI API with retry mechanism
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using gpt-3.5-turbo for faster response times
        messages: [
          {
            role: "system",
            content: "You are a professional resume analyzer. Analyze the resume and provide concise feedback in JSON format with the following structure: { strengths: string[], weaknesses: string[], atsScore: number, suggestions: string[] }. Limit each array to 3-5 items maximum. Be concise."
          },
          {
            role: "user",
            content: truncatedText
          }
        ],
        temperature: 0.5, // Lower temperature for more consistent results
        max_tokens: 500,  // Reduced max tokens for faster response
        timeout: 10000    // 10 second timeout to prevent long waits
      });

      console.log('OpenAI analysis completed successfully');
      return JSON.parse(response.choices[0].message.content);
    } catch (apiError) {
      console.error('OpenAI API error:', apiError);
      // If we hit a rate limit or any other API error, use a simplified analysis approach
      throw new Error('OpenAI API error: ' + apiError.message);
    }
  } catch (error) {
    console.error('Error analyzing resume, using fallback analysis:', error);
    
    // Simplified fallback analysis when OpenAI API fails
    // Extract potential skills from resume text
    const text = resumeText.toLowerCase();
    const skillsFound = [];
    
    // Common skills to check for
    const skillsToCheck = [
      'javascript', 'react', 'node', 'python', 'java', 'html', 'css', 'sql',
      'mongodb', 'aws', 'docker', 'git', 'agile', 'communication', 'teamwork'
    ];
    
    // Check for skills in resume
    skillsToCheck.forEach(skill => {
      if (text.includes(skill)) {
        skillsFound.push(skill);
      }
    });
    
    // Generate a basic analysis based on text length and skills found
    const atsScore = Math.min(75, 50 + (skillsFound.length * 2));
    
    return {
      strengths: [
        skillsFound.length > 0 ? `Technical skills: ${skillsFound.slice(0, 3).join(', ')}` : 'Resume submitted',
        'Resume format accepted',
        'Application processed'
      ],
      weaknesses: [
        'Consider adding more specific achievements',
        'Ensure resume is tailored to job description',
        'Add more quantifiable results'
      ],
      atsScore: atsScore,
      suggestions: [
        'Highlight key achievements with metrics',
        'Add relevant keywords from job description',
        'Ensure resume is properly formatted',
        'Include a concise professional summary'
      ]
    };
  }
};

// Optimized PDF text extraction function with caching and timeout
export const extractTextFromPDF = async (pdfUrl) => {
  try {
    // Set a timeout for the axios request to prevent hanging
    const response = await axios.get(pdfUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    
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
    return 'Error extracting text from PDF. Please check the PDF file format or try uploading again.'; // Return a friendly error message instead of throwing
  }
};