/**
 * AI API Route Handler for Neural Flow
 * Edge runtime with OpenAI GPT-4-turbo integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

import type { AiRequest, AiResponse } from '@/lib/types';
import { AiRequestSchema } from '@/lib/schemas';
import { 
  isServerRateLimited, 
  getRateLimitHeaders,
  cleanupServerRateLimits 
} from '@/lib/ai/rate-limit';
import { 
  getPrompt, 
  createPromptContext, 
  validatePromptContext,
  enhancePromptWithContext 
} from '@/lib/ai/prompts';
import { PersonaSchema } from '@/lib/schemas';
import type { Persona } from '@/lib/types';

// ====================================
// EDGE RUNTIME CONFIGURATION
// ====================================

export const runtime = 'edge';

// ====================================
// CONSTANTS
// ====================================

const AI_CONFIG = {
  model: 'gpt-4-turbo',
  maxTokens: 120,
  temperature: 0.3,
} as const;

const RESPONSE_SCHEMA = z.object({
  response: z.string().max(120, 'Response must be 120 characters or less'),
  confidence: z.number().min(0).max(1).optional(),
});

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Get client IP address from request
 */
function getClientIP(request: NextRequest): string {
  // Try various headers that might contain the real IP
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }
  
  // Fallback to a default IP for development
  return '127.0.0.1';
}

/**
 * Create error response
 */
function createErrorResponse(
  error: string, 
  status: number = 400,
  headers?: Record<string, string>
): NextResponse<AiResponse> {
  const response: AiResponse = {
    response: '',
    promptType: 'SUBTASK', // Default, will be overridden if available
    success: false,
    error,
  };
  
  return NextResponse.json(response, { 
    status, 
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

/**
 * Create success response
 */
function createSuccessResponse(
  data: AiResponse,
  headers?: Record<string, string>
): NextResponse<AiResponse> {
  return NextResponse.json(data, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

// ====================================
// MAIN HANDLER
// ====================================

/**
 * Handle POST requests to AI endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse<AiResponse>> {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request);
    
    // Check server-side rate limits
    if (isServerRateLimited(clientIP)) {
      const rateLimitHeaders = getRateLimitHeaders(clientIP);
      return createErrorResponse(
        'Rate limit exceeded. Please try again later.',
        429,
        rateLimitHeaders
      );
    }
    
    // Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch (parseError) {
      return createErrorResponse('Invalid JSON in request body', 400);
    }
    
    // Validate request schema
    const validationResult = AiRequestSchema.safeParse(requestBody);
    if (!validationResult.success) {
      const errorMessages = validationResult.error.issues
        .map(issue => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      
      return createErrorResponse(`Validation failed: ${errorMessages}`, 400);
    }
    
    const aiRequest: AiRequest = validationResult.data;
    
    // Create and validate prompt context
    const context = createPromptContext(
      aiRequest.content,
      aiRequest.context?.notes as string,
      aiRequest.context?.pomodoroCount as number,
      aiRequest.context?.column as string
    );
    
    if (!validatePromptContext(context)) {
      return createErrorResponse('Invalid prompt context provided', 400);
    }
    
    // Generate prompt configuration
    // Optional persona
    const parsedPersona: Persona | undefined =
      aiRequest.persona && PersonaSchema.safeParse(aiRequest.persona).success
        ? (aiRequest.persona as Persona)
        : undefined;

    const promptConfig = getPrompt(aiRequest.promptType, context, parsedPersona);
    
    // Enhance prompt with additional context
    const enhancedUserPrompt = enhancePromptWithContext(promptConfig.userPrompt, context);
    
    // Make OpenAI API call
    try {
      const result = await generateObject({
        model: openai(AI_CONFIG.model),
        schema: RESPONSE_SCHEMA,
        system: promptConfig.systemPrompt,
        prompt: enhancedUserPrompt,
        temperature: promptConfig.temperature || AI_CONFIG.temperature,
      });
      
      // Validate response length
      if (!result.object.response || result.object.response.length === 0) {
        throw new Error('Empty response from AI');
      }
      
      if (result.object.response.length > 120) {
        // Truncate if necessary
        result.object.response = result.object.response.slice(0, 117) + '...';
      }
      
      // Create successful response
      const aiResponse: AiResponse = {
        response: result.object.response,
        promptType: aiRequest.promptType,
        success: true,
        metadata: {
          model: AI_CONFIG.model,
          tokensUsed: result.usage?.totalTokens || 0,
          confidence: result.object.confidence || 0.8,
          cached: false,
          timestamp: new Date().toISOString(),
        },
      };
      
      // Get rate limit headers
      const rateLimitHeaders = getRateLimitHeaders(clientIP);
      
      return createSuccessResponse(aiResponse, rateLimitHeaders);
      
    } catch (aiError) {
      console.error('OpenAI API error:', aiError);
      
      // Handle specific OpenAI errors
      if (aiError instanceof Error) {
        if (aiError.message.includes('rate limit')) {
          return createErrorResponse(
            'AI service rate limit exceeded. Please try again later.',
            429
          );
        }
        
        if (aiError.message.includes('invalid request')) {
          return createErrorResponse(
            'Invalid request to AI service.',
            400
          );
        }
        
        if (aiError.message.includes('timeout')) {
          return createErrorResponse(
            'AI service timeout. Please try again.',
            408
          );
        }
      }
      
      return createErrorResponse(
        'AI service temporarily unavailable. Please try again later.',
        503
      );
    }
    
  } catch (error) {
    console.error('Unexpected error in AI API route:', error);
    
    return createErrorResponse(
      'Internal server error. Please try again later.',
      500
    );
  }
}

/**
 * Handle GET requests (return API info)
 */
export async function GET(): Promise<NextResponse> {
  const info = {
    service: 'Neural Flow AI API',
    version: '1.0.0',
    model: AI_CONFIG.model,
    maxTokens: AI_CONFIG.maxTokens,
    endpoints: {
      POST: '/api/ai - Generate AI responses for tasks',
    },
    promptTypes: ['SUBTASK', 'ESTIMATE', 'SUMMARY'],
    rateLimit: {
      requests: '30 per minute per IP',
      tokens: '30 per bucket with 0.5/sec refill',
    },
    timestamp: new Date().toISOString(),
  };
  
  return NextResponse.json(info, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
    },
  });
}

/**
 * Handle unsupported methods
 */
export async function PUT(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, POST' } }
  );
}

export async function DELETE(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, POST' } }
  );
}

export async function PATCH(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'GET, POST' } }
  );
}

// ====================================
// CLEANUP TASKS
// ====================================

// Cleanup server rate limits periodically
// In a production environment, this would be handled by a separate service
// or cron job, but for this demo we'll do it in the API route
setInterval(() => {
  cleanupServerRateLimits();
}, 5 * 60 * 1000); // Every 5 minutes

// ====================================
// SECURITY HEADERS
// ====================================

/**
 * Add security headers to all responses
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// ====================================
// TYPE EXPORTS
// ====================================

export type { AiRequest, AiResponse };