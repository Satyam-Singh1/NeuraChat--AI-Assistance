import dotenv from 'dotenv'
import Groq from 'groq-sdk'
import { tavily } from '@tavily/core';
import NodeCache from 'node-cache';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GEN_API_KEY });
const tvly = new tavily({ apiKey: process.env.TAVILY_API_KEY });

const cache = new NodeCache({ stdTTL:60*60*24}); // Cache with 24 hour TTL
export async function generate(userMessage , threadId) {

  const baseMessage = [
    {
      role: 'system',
      content: 'You are a smart personal assistant.'
    },
    // {
    //   role: 'user',
    //   content: 'Curret weather in greater noida ?'
    // }
  ]
  const messages = cache.get(threadId)??baseMessage;

  //Dynamic  tool calling(function calling)
    messages.push({
      role: 'user',
      content: userMessage
    })
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

      /*The LLM send back the function that we have to call and then we have to pass the output of that function into out LLM back
     */
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
            //    console.log("Tool Result:", toolResult) 
            messages.push({
              role: "tool",
              tool_call_id: tool.id,
              content: toolResult,
            })

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