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
    async generateImageDescription(file: Express.Multer.File): Promise<string | null> {
        this.logger.log(`Starting sync analysis for image MIME type: ${file.mimetype}`);

        const imagePart = this.fileToGenerativePart(file.buffer, file.mimetype);
        const prompt = 'Analyze this photo and generate a concise, professional, and technical description in one paragraph, suitable for an infrastructure inspection report. Focus on key elements and conditions.';

        try {
            const response = await this.ai.models.generateContent({ 
                model: AI_MODEL,
                contents: [{ role: 'user', parts: [imagePart, { text: prompt }] }],
            });

            // ⭐ FIX: Safely check if response.text exists before using it.
            if (response.text) {
                return response.text.trim();
            } else {
                // Log if a non-error response was received but contained no text (e.g., filtered content)
                this.logger.warn('Gemini API response was successful but contained no text/content.');
                return null;
            }

        } catch (error) {
            this.logger.error('Gemini API Sync Error:', error.message);
            // If AI fails, we log and return null, allowing the photo upload to succeed.
            return null; 
        }
    }
}
