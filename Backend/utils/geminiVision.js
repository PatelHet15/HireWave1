// utils/geminiVision.js - Implementation for resume analysis using Google's Gemini Pro Vision model
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyzes resume using Google's Gemini Pro Vision model
 * This can analyze both the text content and visual layout of the resume
 * @param {string} resumeUrl - URL to the resume PDF
 * @returns {Object} Analysis results with strengths, weaknesses, atsScore, and suggestions
 */
export const analyzeResumeWithVision = async (resumeUrl) => {
  try {
    console.log('Starting resume analysis with Gemini Pro Vision');
    
    // Download the PDF file
    const pdfBuffer = await downloadPDF(resumeUrl);
    
    // Convert PDF to images
    const imagePaths = await convertPDFToImages(pdfBuffer);
    
    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('Failed to convert PDF to images');
    }
    
    console.log(`Converted PDF to ${imagePaths.length} images`);
    
    // Read the first page image as base64
    const firstPageImagePath = imagePaths[0];
    const imageData = await fs.promises.readFile(firstPageImagePath);
    const base64Image = imageData.toString('base64');
    
    // Get the generative model - using gemini-1.5-flash which can analyze images
    // This is the recommended replacement for the deprecated gemini-pro-vision model
    console.log('Initializing gemini-1.5-flash model');
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.8,
        topK: 32
      }
    });
    
    // Create a structured prompt for the model
    const prompt = `Analyze this resume image and provide detailed professional feedback.
    
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
    console.log('Sending request to Gemini Pro Vision API...');
    
    // Create image part
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg'
      }
    };
    
    // Send request with both text and image
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response.text();
    console.log('Received response from Gemini Pro Vision API');
    
    // Clean up temporary image files
    for (const imagePath of imagePaths) {
      await fs.promises.unlink(imagePath);
    }
    
    // Extract the JSON from the response
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
        const jsonMatch = response.match(/\\{[\\s\\S]*\\}/g);
        if (jsonMatch && jsonMatch.length > 0) {
          jsonStr = jsonMatch[0];
        }
      }
      
      console.log('Extracted JSON from Gemini Pro Vision response');
      
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
      console.error('Error parsing Gemini Pro Vision response:', parseError);
      throw parseError;
    }
  } catch (error) {
    console.error('Error in Gemini Pro Vision resume analysis:', error);
    throw error; // Let the controller handle the error
  }
};

/**
 * Downloads a PDF file from a URL
 * @param {string} url - URL to the PDF file
 * @returns {Buffer} PDF file as a buffer
 */
async function downloadPDF(url) {
  try {
    const response = await axios.get(url, { 
      responseType: 'arraybuffer',
      timeout: 10000 // 10 second timeout
    });
    return response.data;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF file');
  }
}

/**
 * Converts a PDF buffer to JPEG images
 * @param {Buffer} pdfBuffer - PDF file as a buffer
 * @returns {Array<string>} Array of paths to the generated image files
 */
async function convertPDFToImages(pdfBuffer) {
  try {
    // Use pdf2pic library for conversion
    const { PDFDocument } = await import('pdf-lib');
    const { fromBuffer } = await import('pdf2pic');
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pageCount = pdfDoc.getPageCount();
    
    // Create temp directory for images
    const tempDir = path.resolve('./temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    
    // Configure the conversion
    const options = {
      density: 300,
      saveFilename: "resume_page",
      savePath: tempDir,
      format: "jpg",
      width: 2000,
      height: 2000
    };
    
    // Convert PDF to images
    const convert = fromBuffer(pdfBuffer, options);
    
    // Only convert the first page for analysis
    const pageToConvert = 1; // First page
    const result = await convert(pageToConvert);
    
    return [result.path];
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    
    // Fallback to using pdf-poppler if available
    try {
      const { convert } = await import('pdf-poppler');
      
      const tempDir = path.resolve('./temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      
      // Save PDF buffer to temp file
      const tempPdfPath = path.join(tempDir, 'temp.pdf');
      await fs.promises.writeFile(tempPdfPath, pdfBuffer);
      
      // Convert options
      const options = {
        format: 'jpeg',
        out_dir: tempDir,
        out_prefix: 'resume_page',
        page: 1
      };
      
      await convert(tempPdfPath, options);
      
      // Clean up temp PDF
      await fs.promises.unlink(tempPdfPath);
      
      return [path.join(tempDir, 'resume_page-1.jpg')];
    } catch (fallbackError) {
      console.error('Error in fallback PDF conversion:', fallbackError);
      throw new Error('Failed to convert PDF to images');
    }
  }
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
    throw new Error('Error extracting text from PDF. Please check the PDF file format or try uploading again.');
  }
};
