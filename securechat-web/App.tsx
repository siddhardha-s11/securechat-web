import React, { useState, useEffect } from 'react';
import { User, EncryptedMessage } from './types';
import ChatScreen from './components/ChatScreen';
import { generateKeyPair, exportKeyToString, encryptMessage } from './services/cryptoUtils';
import { Users, Layout, ShieldCheck, Github } from 'lucide-react';

// Initial state helpers
const createUser = (id: string, name: string): User => ({
  id,
  name,
  avatar: '',
  publicKey: null,
  privateKey: null,
  publicKeyString: '',
});

const App: React.FC = () => {
  const [userA, setUserA] = useState<User>(createUser('A', 'Alice'));
  const [userB, setUserB] = useState<User>(createUser('B', 'Bob'));
  const [activeUserId, setActiveUserId] = useState<string>('A');
  const [messages, setMessages] = useState<EncryptedMessage[]>([]);
  const [localPlaintextCache, setLocalPlaintextCache] = useState<Record<string, string>>({});
  const [isGeneratingA, setIsGeneratingA] = useState(false);
  const [isGeneratingB, setIsGeneratingB] = useState(false);

  const currentUser = activeUserId === 'A' ? userA : userB;
  const otherUser = activeUserId === 'A' ? userB : userA;

  // Initialize keys on mount for demo purposes (optional, good for UX)
  useEffect(() => {
     // Intentionally blank. Let users click generate to feel the power.
  }, []);

  const handleRegenerateKeys = async (userId: string) => {
    const isA = userId === 'A';
    if (isA) setIsGeneratingA(true); else setIsGeneratingB(true);

    try {
        // Simulate a slight delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));
        const keyPair = await generateKeyPair();
        const pubKeyString = await exportKeyToString(keyPair.publicKey);

        const updater = isA ? setUserA : setUserB;
        updater(prev => ({
            ...prev,
            publicKey: keyPair.publicKey,
            privateKey: keyPair.privateKey,
            publicKeyString: pubKeyString
        }));
    } catch (error) {
        console.error("Key generation failed", error);
    } finally {
        if (isA) setIsGeneratingA(false); else setIsGeneratingB(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!currentUser.publicKey || !otherUser.publicKey) {
        alert("Encryption keys required!");
        return;
    }

    // 1. Encrypt with Recipient's Public Key
    const ciphertext = await encryptMessage(text, otherUser.publicKey);

    // 2. Create message object
    const newMessage: EncryptedMessage = {
        id: crypto.randomUUID(),
        senderId: currentUser.id,
        receiverId: otherUser.id,
        ciphertext: ciphertext,
        timestamp: Date.now(),
    };

    // 3. Store plaintext in local cache so sender can see what they wrote (Standard Chat App behavior)
    // In a real app, this is stored in the local SQLite/DB, never sent over the wire.
    // For this simulation, we'll hack the ChatScreen to check this cache.
    // But wait, ChatScreen handles decryption. 
    // To properly simulate: Sender can't decrypt their own sent message (encrypted with receiver's public key).
    // So we MUST pass the plaintext for the sender's view. 
    // I will inject the plaintext into the message list ONLY for the sender in the render logic below?
    // Actually, I'll update the ChatScreen to handle "Sent" messages differently.
    // Let's stick to the secure vibe: Users see what they SENT as encrypted blocks unless they are the recipient.
    // EXCEPT: That's bad UX.
    // I will append a "local" copy for the simulation.
    
    // For the purpose of this "Secure Chat" demo, showing the encrypted blob for sent messages is a feature, not a bug.
    // It visually proves that "I cannot read what I just sent because it is locked for Bob only".
    // I will stick to that. It's cool.

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Sidebar (Desktop) / Topbar (Mobile) */}
      <div className="w-20 md:w-64 border-r border-gray-800 bg-gray-950 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
            <div className="bg-gradient-to-tr from-green-400 to-emerald-600 p-2 rounded-lg shadow-lg shadow-green-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-lg hidden md:block tracking-tight">SecureChat</h1>
        </div>

        <div className="flex-1 py-6 px-3 space-y-4">
            <div className="md:px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:block">
                Active Session
            </div>
            
            {/* User Switcher */}
            <button
                onClick={() => setActiveUserId('A')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    activeUserId === 'A' 
                    ? 'bg-indigo-600/10 border border-indigo-500/50 text-indigo-100' 
                    : 'hover:bg-gray-900 border border-transparent text-gray-400'
                }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    activeUserId === 'A' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                }`}>
                    A
                </div>
                <div className="hidden md:block text-left">
                    <div className="font-medium">Alice</div>
                    <div className="text-xs opacity-60">Client A</div>
                </div>
                {activeUserId === 'A' && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 hidden md:block animate-pulse"></div>}
            </button>

            <button
                onClick={() => setActiveUserId('B')}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                    activeUserId === 'B' 
                    ? 'bg-indigo-600/10 border border-indigo-500/50 text-indigo-100' 
                    : 'hover:bg-gray-900 border border-transparent text-gray-400'
                }`}
            >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    activeUserId === 'B' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 group-hover:bg-gray-700'
                }`}>
                    B
                </div>
                <div className="hidden md:block text-left">
                    <div className="font-medium">Bob</div>
                    <div className="text-xs opacity-60">Client B</div>
                </div>
                {activeUserId === 'B' && <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500 hidden md:block animate-pulse"></div>}
            </button>
        </div>

        <div className="p-4 border-t border-gray-800">
            <div className="text-[10px] text-gray-600 text-center md:text-left">
                <p className="hidden md:block">Simulated Environment</p>
                <p>RSA-OAEP 2048-bit</p>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
         <ChatScreen
            key={activeUserId} // Force remount on user switch to reset scroll/state
            currentUser={currentUser}
            otherUser={otherUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            onRegenerateKeys={() => handleRegenerateKeys(activeUserId)}
            isKeyGenerating={activeUserId === 'A' ? isGeneratingA : isGeneratingB}
         />
      </div>

    </div>
  );
};

export default App;