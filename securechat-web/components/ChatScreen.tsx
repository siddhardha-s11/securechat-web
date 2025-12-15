import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User as UserIcon, LockKeyhole } from 'lucide-react';
import { User, EncryptedMessage, DecryptedMessage } from '../types';
import { generateSmartDraft } from '../services/geminiService';
import MessageBubble from './MessageBubble';
import KeyStatus from './KeyStatus';
import { decryptMessage } from '../services/cryptoUtils';

interface ChatScreenProps {
  currentUser: User;
  otherUser: User;
  messages: EncryptedMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onRegenerateKeys: () => void;
  isKeyGenerating: boolean;
}

const ChatScreen: React.FC<ChatScreenProps> = ({
  currentUser,
  otherUser,
  messages,
  onSendMessage,
  onRegenerateKeys,
  isKeyGenerating
}) => {
  const [input, setInput] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [isDrafting, setIsDrafting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const decryptAll = async () => {
      if (!currentUser.privateKey) {
        // Can't decrypt if we don't have keys, but we can show own messages if we assume we stored plaintext locally
        // For this demo, we will only show "Encrypted" blobs if key is missing
        const placeholders = messages.map(msg => ({
             ...msg,
             plaintext: "Waiting for private key...",
             isDecrypted: false
        }));
        setDecryptedMessages(placeholders);
        return;
      }

      const decoded = await Promise.all(messages.map(async (msg) => {
        if (msg.senderId === currentUser.id) {
           // For own messages, we usually store plaintext locally in a real app.
           // Here, we'll try to decrypt (if we sent it to ourselves) or just show a placeholder if we didn't encrypt for self.
           // In this simulation, we will assume we can't read our own sent messages from the wire unless we stored them.
           // BUT, for the UX, let's cheat slightly and try to decrypt with otherUser's private key? No that's impossible.
           // Realistically: The sender stores the plaintext in local history. 
           // We will handle this by passing plaintext in the message object for the sender's view in App.tsx state? 
           // To keep it strictly "Encrypted Chat", the sender usually encrypts a copy for themselves.
           // For simplicity in this demo: we will just show "Encrypted Content" for sent messages 
           // unless we implement "encrypt for self" too.
           // WAIT: App.tsx stores the messages. Let's assume we can read our own messages from local state if we had them.
           // Actually, let's implement the decryption properly: 
           // If I am the receiver, I use my Private Key.
           if (msg.receiverId === currentUser.id) {
               const text = await decryptMessage(msg.ciphertext, currentUser.privateKey!);
               return { ...msg, plaintext: text, isDecrypted: true };
           } else {
               // I am the sender. In a real secure chat, I can't decrypt what I sent unless I encrypted a copy for myself.
               // For this demo, let's just show the ciphertext for sent messages to emphasize security, 
               // OR we can pretend we have the plaintext.
               // Let's show Ciphertext to prove we don't keep logs! (Hardcore mode)
               // Users might find that confusing. Let's just say "Message Sent (Secure)"
               // Actually, for the demo to be usable, let's just pass the plaintext through a side channel in App.tsx 
               // purely for UI rendering of *sent* messages.
               // See App.tsx implementation of message handling.
               // Actually, let's just try to decrypt with *our* private key? No, it was encrypted with *their* public key.
               // We will rely on the "plaintext" property if it exists (local cache) or show encrypted.
               // Since we don't have a local cache prop in EncryptedMessage, let's add a hack or just show raw.
               return { ...msg, plaintext: "(Encrypted content only viewable by recipient)", isDecrypted: false };
           }
        } else {
            // Incoming message
            if (currentUser.privateKey) {
                 const text = await decryptMessage(msg.ciphertext, currentUser.privateKey);
                 return { ...msg, plaintext: text, isDecrypted: true };
            }
            return { ...msg, plaintext: "Encrypted Message", isDecrypted: false };
        }
      }));
      setDecryptedMessages(decoded);
    };
    decryptAll();
  }, [messages, currentUser.privateKey, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decryptedMessages]);


  const handleSend = async () => {
    if (!input.trim()) return;
    await onSendMessage(input);
    setInput('');
  };

  const handleSmartDraft = async () => {
    if (!input.trim()) return;
    setIsDrafting(true);
    const draft = await generateSmartDraft(input, "Secure Chat Context");
    setInput(draft);
    setIsDrafting(false);
  };

  const canChat = !!currentUser.publicKey && !!otherUser.publicKey;

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/50 backdrop-blur">
        <div className="flex items-center gap-3">
            <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {otherUser.name.charAt(0)}
                </div>
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${otherUser.publicKey ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            </div>
            <div>
                <h2 className="font-semibold text-gray-100">{otherUser.name}</h2>
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <LockKeyhole className="w-3 h-3 text-green-500" />
                    <span>End-to-End Encrypted</span>
                </div>
            </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-2">
        <KeyStatus user={currentUser} onRegenerateKeys={onRegenerateKeys} isGenerating={isKeyGenerating} />
        
        {decryptedMessages.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-gray-600">
                <LockKeyhole className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">No messages yet. Start a secure conversation.</p>
             </div>
        ) : (
            decryptedMessages.map((msg) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                isOwn={msg.senderId === currentUser.id} 
            />
            ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-800 bg-gray-900/30">
        {!canChat ? (
            <div className="text-center text-sm text-red-400 bg-red-950/20 py-3 rounded-lg border border-red-900/50">
                Both users must generate keys to establish a secure channel.
            </div>
        ) : (
            <div className="flex flex-col gap-2">
                <div className="flex items-end gap-2 bg-gray-800/50 p-2 rounded-xl border border-gray-700/50 focus-within:border-indigo-500/50 transition-colors">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Message ${otherUser.name}...`}
                        className="flex-1 bg-transparent text-gray-100 placeholder-gray-500 text-sm p-2 outline-none resize-none min-h-[44px] max-h-32 custom-scrollbar"
                        onKeyDown={(e) => {
                            if(e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <div className="flex gap-2 pb-1 pr-1">
                        <button
                            onClick={handleSmartDraft}
                            disabled={!input.trim() || isDrafting}
                            className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-lg transition-all disabled:opacity-50"
                            title="Gemini Smart Draft"
                        >
                            <Sparkles className={`w-5 h-5 ${isDrafting ? 'animate-pulse' : ''}`} />
                        </button>
                        <button
                            onClick={handleSend}
                            disabled={!input.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex justify-between px-1">
                     <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Messages are encrypted locally before sending
                     </span>
                     {input.length > 0 && (
                        <span className="text-[10px] text-gray-500">
                           Press Enter to send, Shift+Enter for new line
                        </span>
                     )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default ChatScreen;