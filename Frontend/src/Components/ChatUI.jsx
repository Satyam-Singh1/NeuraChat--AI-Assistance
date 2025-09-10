import React, { useState, useEffect, useRef } from "react";

// Input Component
function Input({ handleMessageSent }) {
  const [inputText, setInputText] = useState("");
  
  const handleClick = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      handleMessageSent(inputText);
      setInputText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div className="relative">
      {/* Glowing border effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-sm opacity-30"></div>
      
      <div className="relative flex items-end gap-3 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
        <div className="flex-grow relative">
          <textarea
            rows={1}
            placeholder="Enter your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full resize-none bg-transparent text-white placeholder-gray-400 outline-none text-sm leading-relaxed max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent"
            style={{ minHeight: '24px' }}
          />
          {/* Animated cursor line */}
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-cyan-400 to-purple-400 animate-pulse"></div>
        </div>
        
        <button
          onClick={handleClick}
          disabled={!inputText.trim()}
          className="group relative flex items-center justify-center w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          <svg
            className="w-5 h-5 text-white transform group-hover:translate-x-0.5 transition-transform duration-200"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          
          {/* Hover glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl blur-md opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
}

// Main Chat Component
export default function ChatUI() {
  const [messages, setMessages] = useState([
    {
      text: "Welcome! How can I assist you today?",
      sender: "ai",
      timestamp: Date.now()
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const callServer = async (inputText) => {
    // Simulated API call - replace with your actual endpoint
    const response = await fetch("http://localhost:3000/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: inputText, threadId }),
    });
    // const response = await fetch("https://neurachat-ai-assistance.onrender.com/chat", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ message: inputText, threadId }),
    // });

    if (!response.ok) {
      throw new Error("Error in generating the response");
    }
    const finalResult = await response.json();

    if (!threadId) setThreadId(finalResult.threadId);
    return finalResult.message;
  };

  const handleMessageSent = async (message) => {
    const userMessage = {
      text: message,
      sender: "user",
      timestamp: Date.now()
    }; 
  
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      const aiResponse = await callServer(message);
      const aiMessage = {
        text: aiResponse,
        sender: "ai",
        timestamp: Date.now()
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setMessages((prev) => [
        ...prev,
        { 
          text: "⚠️ Connection error. Please try again.", 
          sender: "ai",
          timestamp: Date.now()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Grid pattern overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      ></div>

      <div className="flex flex-col w-3xl mx-auto h-full relative z-10 px-4">
        {/* Header */}
        <header className="flex items-center justify-between py-6 border-b border-gray-700/30 backdrop-blur-sm">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 bg-white/20 rounded-md backdrop-blur-sm"></div>
              </div>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Neural Chat Interface
              </h1>
              <p className="text-xs text-gray-400">AI Assistant • Online</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
              <div className="w-2 h-2 bg-pink-400 rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
            </div>
          </div>
        </header>

        {/* Messages Section */}
        <main className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-none">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"} group`}
            >
              <div className={`flex items-start space-x-3 max-w-2xl ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                  message.sender === "user" 
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500" 
                    : "bg-gradient-to-r from-purple-500 to-pink-500"
                }`}>
                  {message.sender === "user" ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                  )}
                </div>

                {/* Message bubble */}
                <div className="relative">
                  <div
                    className={`relative px-4 py-3 rounded-2xl backdrop-blur-sm transition-all duration-300 group-hover:shadow-lg ${
                      message.sender === "user"
                        ? "bg-gradient-to-r from-blue-600/80 to-cyan-600/80 text-white rounded-br-md border border-blue-500/30"
                        : "bg-gray-800/80 text-gray-100 rounded-bl-md border border-gray-700/50"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>
                    
                    {/* Timestamp */}
                    <div className={`mt-2 text-xs opacity-60 ${message.sender === "user" ? "text-right" : "text-left"}`}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                  
                  {/* Message glow effect */}
                  <div className={`absolute inset-0 rounded-2xl blur-sm opacity-0 group-hover:opacity-30 transition-opacity duration-300 ${
                    message.sender === "user" 
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500" 
                      : "bg-gradient-to-r from-purple-500 to-pink-500"
                  }`}></div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start group">
              <div className="flex items-start space-x-3 max-w-2xl">
                <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                </div>
                <div className="bg-gray-800/80 backdrop-blur-sm text-gray-100 px-4 py-3 rounded-2xl rounded-bl-md border border-gray-700/50">
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gradient-to-r from-pink-400 to-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-300">Processing your request...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Input Section */}
        <div className="py-4">
          <Input handleMessageSent={handleMessageSent} />
        </div>
      </div>
    </div>
  );
}
