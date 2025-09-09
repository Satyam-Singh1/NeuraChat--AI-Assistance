import dotenv from 'dotenv'
import Groq from 'groq-sdk'
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GEN_API_KEY });
const tvly = new tavily({ apiKey: process.env.TAVILY_API_KEY });

const cache = new NodeCache({ stdTTL:60*60*24}); // Cache with 24 hour TTL

// Function to detect phone numbers in user message
function detectPhoneNumber(message) {
  // Remove all non-digit characters and extract only digits
  const digits = message.replace(/\D/g, '');
  
  // Check if we have exactly 10 digits
  if (digits.length === 10) {
    // Additional validation: Indian mobile numbers typically start with 6, 7, 8, or 9
    if (/^[6-9]/.test(digits)) {
      return {
        detected: true,
        number: digits,
        formatted: `${digits.slice(0, 5)} ${digits.slice(5)}`
      };
    }
    // If it's 10 digits but doesn't follow Indian format, still consider it a phone number
    return {
      detected: true,
      number: digits,
      formatted: `${digits.slice(0, 5)} ${digits.slice(5)}`
    };
  }
  
  // Check for 11 digits starting with country code (like +91)
  if (digits.length === 11 && digits.startsWith('91') && /^91[6-9]/.test(digits)) {
    return {
      detected: true,
      number: digits.slice(2), // Remove country code
      formatted: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`,
      withCountryCode: true
    };
  }
  
  // Check for 12 digits with country code like 919876543210
  if (digits.length === 12 && digits.startsWith('91') && /^91[6-9]/.test(digits)) {
    return {
      detected: true,
      number: digits.slice(2),
      formatted: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`,
      withCountryCode: true
    };
  }
  
  return { detected: false };
}

export async function generate(userMessage, threadId) {
  const baseMessage = [
    {
      role: 'system',
      content: 'You are a smart personal assistant. When you detect that a phone number has been shared, acknowledge it appropriately and ask how you can help with it.'
    },
  ]
  
  const messages = cache.get(threadId) ?? baseMessage;
  
  // Check for phone number in user message
  const phoneDetection = detectPhoneNumber(userMessage);
  
  if (phoneDetection.detected) {
    // Create a special response for phone number detection
    const phoneResponse = {
      role: 'assistant',
      content: `📱 Phone number detected: ${phoneDetection.formatted}\n\nI can see you've shared a phone number. How would you like me to assist you with this? I can help with:\n• Formatting verification\n• Information about the number\n• Or any other related queries you might have.`
    };
    
    // Add user message and phone detection response to conversation
    messages.push({
      role: 'user',
      content: userMessage
    });
    messages.push(phoneResponse);
    
    // Cache the updated messages
    cache.set(threadId, messages);
    
    return phoneResponse.content;
  }

  // If no phone number detected, proceed with normal flow
  messages.push({
    role: 'user',
    content: userMessage
  });

  while (true) {
    const completions = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      messages: messages, 
      tools: [
        {
          type: "function",
          function: {
            name: 'webSearch',
            description: 'Useful for when you need to answer questions about current events. Use this tool to search the web for relevant information.',
            parameters: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'The search query to look up on the web.'
                }
              },
              required: ['query']
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    messages.push(completions.choices[0].message);
    const toolCalls = completions.choices[0].message.tool_calls;

    if (!toolCalls) {
      cache.set(threadId, messages);
      return completions.choices[0].message.content;
    }
    else {
      for (const tool of toolCalls) {
        const functionName = tool.function.name;
        const functParams = tool.function.arguments;

        if (functionName == 'webSearch') {
          const toolResult = await webSearch(JSON.parse(functParams));
          messages.push({
            role: "tool",
            tool_call_id: tool.id,
            content: toolResult,
          });
        }
      }
    }
  }
}

async function webSearch({ query }) {
  console.log("Calling web ...");
  const response = await tvly.search(query);
  const finalResult = response.results.map((result) => result.content).join("\n");
  return finalResult;
}