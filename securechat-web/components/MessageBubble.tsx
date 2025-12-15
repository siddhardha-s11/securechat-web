import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Eye, EyeOff, Bot } from 'lucide-react';
import { DecryptedMessage } from '../types';
import { analyzeSecurity } from '../services/geminiService';

interface MessageBubbleProps {
  message: DecryptedMessage;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const [showRaw, setShowRaw] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const toggleView = () => setShowRaw(!showRaw);

  const handleAnalyze = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (aiAnalysis) return;
    setIsAnalyzing(true);
    const analysis = await analyzeSecurity(message.plaintext);
    setAiAnalysis(analysis);
    setIsAnalyzing(false);
  };

  return (
    <div className={`flex flex-col mb-4 ${isOwn ? 'items-end' : 'items-start'}`}>
      <div 
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl p-4 relative group transition-all duration-300 ${
          isOwn 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'
        }`}
      >
        <div className="flex items-center justify-between gap-4 mb-2 border-b border-white/10 pb-2">
          <div className="flex items-center gap-1.5 text-xs opacity-70">
            {showRaw ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
            <span className="font-mono">
                {showRaw ? 'RSA-ENCRYPTED' : 'DECRYPTED'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!isOwn && !showRaw && (
                <button 
                    onClick={handleAnalyze}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                    title="Ask AI about security"
                >
                    <Bot className={`w-3 h-3 ${isAnalyzing ? 'animate-pulse text-yellow-300' : ''}`} />
                </button>
            )}
            <button 
                onClick={toggleView}
                className="p-1 hover:bg-white/10 rounded transition-colors"
            >
                {showRaw ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="break-words font-sans text-sm leading-relaxed">
          {showRaw ? (
             <p className="font-mono text-xs opacity-60 break-all bg-black/20 p-2 rounded">
               {message.ciphertext}
             </p>
          ) : (
            <p className="whitespace-pre-wrap">{message.plaintext}</p>
          )}
        </div>
        
        <div className="mt-2 text-[10px] opacity-50 text-right font-mono">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>

        {/* AI Analysis Tooltip/Card */}
        {aiAnalysis && !showRaw && (
             <div className="mt-3 p-2 bg-black/20 rounded border border-white/10 text-xs text-yellow-100/90 flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                <Bot className="w-3 h-3 mt-0.5 shrink-0" />
                <p>{aiAnalysis}</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;