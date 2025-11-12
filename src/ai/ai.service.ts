import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// CORRECT IMPORT: Use the new package and class name
import { GoogleGenAI, Part } from '@google/genai';
import { Readable } from 'stream';

// Define the model we want to use for image analysis
const AI_MODEL = 'gemini-2.5-flash';

@Injectable()
export class AiService {
    // Correct client type
    private readonly ai: GoogleGenAI; 
    private readonly logger = new Logger(AiService.name);

    constructor(private configService: ConfigService) {
        // Securely retrieve the API key from the environment
        const apiKey = this.configService.get<string>('GEMINI_API_KEY');

        if (!apiKey) {
            this.logger.error('GEMINI_API_KEY is missing from environment configuration.');
            throw new InternalServerErrorException('AI Service configuration is incomplete.');
        }

        // Initialize the SDK with the key. The new SDK uses a configuration object.
        this.ai = new GoogleGenAI({ apiKey }) // : "AIzaSyBCBz3wQu9Jjd_icCDZf-17CUO_O8IynwI" }) // * youtuber
    }

    /**
     * Converts a file buffer (from Multer) into a Gemini-compatible Part object.
     * @param buffer The file buffer.
     * @param mimeType The file's MIME type (e.g., 'image/jpeg').
     * @returns A Part object for the Gemini API.
     */
    private fileToGenerativePart(buffer: Buffer, mimeType: string): Part {
        // Convert buffer to Base64 string for inline submission
        return {
            inlineData: {
                data: buffer.toString('base64'),
                mimeType,
            },
        };
    }

    /**
     * Generates a description for an image and returns a stream of text chunks.
     * NOTE: This is for the *future* SSE implementation.
     * @param file The image file buffer and mime type.
     * @returns A Readable stream of strings (text chunks).
     */
    async streamImageDescription(file: Express.Multer.File): Promise<Readable> {
        this.logger.log(`Starting streaming analysis for image MIME type: ${file.mimetype}`);

        const imagePart = this.fileToGenerativePart(file.buffer, file.mimetype);

        const prompt = 'Analyze this photo and generate a concise, professional, and technical description in one paragraph, suitable for an infrastructure inspection report. Focus on key elements and conditions.';

        try {
            // FIX: models is now accessed via the 'ai' instance property.
            const responseStream = await this.ai.models.generateContentStream({ 
                model: AI_MODEL,
                contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
            });
            
            // ... (Rest of the streaming logic remains the same) ...
            const outputStream = new Readable({
                read() {},
            });

            (async () => {
                for await (const chunk of responseStream) {
                    const text = chunk.text;
                    if (text) {
                        outputStream.push(text);
                    }
                }
                outputStream.push(null);
            })();

            return outputStream;

        } catch (error) {
            this.logger.error('Gemini API Streaming Error:', error.message);
            throw new InternalServerErrorException('Failed to generate description from AI.');
        }
    }

    /**
     * Generates a single, complete description for an image (non-streaming, used during upload).
     * @param file The image file buffer and mime type.
     * @returns The complete generated text description.
     */
    /**
     * Generates a single, complete description for an image (non-streaming, used during upload).
     * Implements exponential backoff to handle transient 503 UNAVAILABLE errors.
     * @param file The image file buffer and mime type.
     * @returns The complete generated text description or null on final failure.
     */
    async generateImageDescription(file: Express.Multer.File): Promise<string | null> {
        this.logger.log(`Starting sync analysis for image MIME type: ${file.mimetype}`);

        const imagePart = this.fileToGenerativePart(file.buffer, file.mimetype);
        const prompt = 'Analyze this photo and generate a concise, professional, and technical description in one paragraph, suitable for an infrastructure inspection report. Focus on key elements and conditions.';

        const MAX_RETRIES = 3;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                this.logger.log(`Attempt ${attempt} of ${MAX_RETRIES} to call Gemini API.`);
                
                const response = await this.ai.models.generateContent({ 
                    model: AI_MODEL, // This is still 'gemini-2.5-flash'
                    contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
                });

                if (response.text) {
                    return response.text.trim();
                } else {
                    this.logger.warn(`Attempt ${attempt} succeeded but returned no text/content. Retrying...`);
                }

            } catch (error) {
                // Check if it's the expected 503 error
                const isRetryableError = error.message && (
                    error.message.includes('"code":503') ||
                    error.message.includes('The model is overloaded')
                );

                if (attempt < MAX_RETRIES && isRetryableError) {
                    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s delay
                    this.logger.warn(`Gemini API Sync Error (Attempt ${attempt}): ${error.message}. Retrying in ${delay / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue; // Continue to the next loop iteration (retry)
                } 
                
                // If it's the last attempt or a different error (like 400, 403, 404), throw/return null
                this.logger.error('Gemini API Final Error or Unhandled:', error.message);
                return null; 
            }
        }
        
        return null; // Should be unreachable, but ensures method returns null on final failure.
    }
}
