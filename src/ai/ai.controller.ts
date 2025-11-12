import { Controller, MessageEvent, Post, Sse, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Readable } from 'stream';
import { AiService } from './ai.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) {}

    /**
     * Helper to convert a Readable stream of text chunks into an Observable of MessageEvent.
     */
    private streamToMessageEventObservable(stream: Readable): Observable<MessageEvent> {
        return new Observable<string>(subscriber => {
            stream.on('data', (chunk) => {
                subscriber.next(chunk.toString());
            });
            stream.on('error', (err) => {
                subscriber.error(err);
            });
            stream.on('end', () => {
                subscriber.complete();
            });
        }).pipe(
            map(chunk => ({ data: chunk.toString() } as MessageEvent)),
        );
    }

    /**
     * POST /ai/stream-analysis
     * Accepts a file upload and streams the AI-generated description back 
     * using Server-Sent Events (SSE).
     */
    @Post('stream-analysis')
    @Sse() // ('stream-analysis') // * decorator, which tells NestJS to manage the SSE connection and expects an Observable or a Readable stream (which AiService already returns)
    @UseInterceptors(FileInterceptor('image')) // Expects the file to be under the 'image' field
    async streamAnalysis(@UploadedFile() file: Express.Multer.File): Promise<Observable<MessageEvent>> {

        if (!file) {
            // Instead of using a raw Readable stream (which leads to the type error), 
            // we create an Observable that emits a single MessageEvent with an error message.
            return new Observable<MessageEvent>(subscriber => {
                // Emit the error event
                subscriber.next({ 
                    data: 'Error: No image file provided', 
                    type: 'error', // Use 'type' for client-side error handling
                });
                subscriber.complete();
            });
        }
        
        // 2. Process file using the service (Success Path)
        try {
            const stream = await this.aiService.streamImageDescription(file);
            
            // Use the helper to handle the full conversion to Observable<MessageEvent>
            return this.streamToMessageEventObservable(stream);
            
        } catch (error) {
             return new Observable<MessageEvent>(subscriber => {
                subscriber.next({ 
                    data: `Fatal Error during AI processing: ${error.message}`, 
                    type: 'error',
                });
                subscriber.complete();
            });
        }
    }
}
