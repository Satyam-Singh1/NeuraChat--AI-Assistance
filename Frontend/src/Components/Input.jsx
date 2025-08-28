
import React, { useState, useEffect, useRef } from "react";

// Input Component
export function Input({ handleMessageSent }) {
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
      
      <form className="relative flex items-end gap-3 bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
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
          type="submit"
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
      </form>
    </div>
  );
}