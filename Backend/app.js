import dotenv from 'dotenv'
import Groq from 'groq-sdk'
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GEN_API_KEY });
const tvly = new tavily({ apiKey: process.env.TAVILY_API_KEY });

//Im using NODE CACHE for memory temporary storage
const cache = new NodeCache({ stdTTL:60*60*24}); // Cache with 24 hour TTL


function detectPhoneNumber(message) {
  // Remove all non-digit characters and extract only digits
  const digits = message.replace(/\D/g, '');

  // Case 1: 10-digit number
  if (digits.length <= 10 && digits.length >=9) {
    return {
      detected: true,
      number: digits,
      formatted: `${digits.slice(0, 5)} ${digits.slice(5)}`,
      method: 'direct_10'
    };
  }

// Case 2: 11 digits with leading 0 (e.g., 09876543210)
if (digits.length === 11 && digits.startsWith('0') && /^[6-9]/.test(digits[1])) {
  return {
    detected: true,
    number: digits.slice(1), // remove leading 0
    formatted: `${digits.slice(1, 6)} ${digits.slice(6)}`,
    method: 'leading_0'
  };
}

// Case 3: 12 digits with country code (e.g., 919876543210)
if (digits.length === 12 && digits.startsWith('91') && /^[6-9]/.test(digits[2])) {
  return {
    detected: true,
    number: digits.slice(2),
    formatted: `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`,
    withCountryCode: true,
    method: 'country_code_12'
  };
}


  // Case 4: Sliding window approach
  const slidingWindowApproachResult = detectPhoneNumber2(message);
  if (slidingWindowApproachResult.detected) {
    return slidingWindowApproachResult; // return full object instead of collapsing
  }

  return { detected: false };
}

// ============================================
// APPROACH 2: SLIDING WINDOW ALGORITHM
// ============================================

function detectPhoneNumber2(message) {
  const digits = [];
  let i = 0;

  // Extract digits while maintaining position info
  for (let char of message) {
    if (/\d/.test(char)) {
      digits.push({ digit: char, position: i });
    }
    i++;
  }

  // If less than 10 digits, no valid phone number
  if (digits.length < 10) return { detected: false };

  // Sliding window approach
  for (let start = 0; start <= digits.length - 10; start++) {
    const window = digits.slice(start, start + 10);
    const numberStr = window.map(d => d.digit).join('');

    // Check if valid Indian mobile number
    if (/^[6-9]/.test(numberStr)) {
      return {
        detected: true,
        number: numberStr,
        formatted: `${numberStr.slice(0, 5)} ${numberStr.slice(5)}`,
        method: 'sliding_window',
        positions: window.map(d => d.position)
      };
    }
  }

  return { detected: false };
}

export async function generate(userMessage, threadId) {
  const baseMessage = [
    {
      role: 'system',
      content: `You are a helpful personal assistant.

Your responsibilities:
1. If a user shares a phone number:
   - Detect it clearly.
   - Acknowledge the phone number.
   - Show a warning message:
     • 📱 Phone number detected  
     • Your credit score has been decremented by 10 points  
     • Warning: after too many attempts your account might be blocked
   - Always format the warning in **separate lines**.

2. For all other user queries:
   - Provide accurate, helpful, and concise answers.
   - If you need up-to-date information, call the webSearch tool.

3. Maintain a polite, professional tone.`
    },
  ];

  
  const messages = cache.get(threadId) ?? baseMessage;
  
  // Check for phone number in user message
  const phoneDetection = detectPhoneNumber(userMessage);
  
  if (phoneDetection.detected) {
    // Create a special response for phone number detection
    const phoneResponse = {
      role: 'assistant',
    content: `📱 Phone number detected:${phoneDetection.formatted}. \n Your credit score has been decremented by 10 Points\n ⚠️Warning: after too many attempts your account might be blocked.`


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