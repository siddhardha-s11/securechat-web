import React from 'react';
import { Key, ShieldCheck, ShieldAlert, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface KeyStatusProps {
  user: User;
  onRegenerateKeys: () => void;
  isGenerating: boolean;
}

const KeyStatus: React.FC<KeyStatusProps> = ({ user, onRegenerateKeys, isGenerating }) => {
  const hasKeys = !!user.publicKey;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {hasKeys ? (
            <ShieldCheck className="w-5 h-5 text-green-500" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-500" />
          )}
          <h3 className="text-sm font-semibold text-gray-200">
            {hasKeys ? "Encryption Active (RSA-2048)" : "Keys Missing"}
          </h3>
        </div>
        <button
          onClick={onRegenerateKeys}
          disabled={isGenerating}
          className="p-1.5 hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
          title="Regenerate Keys"
        >
          <RefreshCw className={`w-4 h-4 text-gray-400 ${isGenerating ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 uppercase font-mono tracking-wider block mb-1">Public Key Fingerprint</label>
          <div className="bg-black/50 p-2 rounded border border-gray-800 font-mono text-xs text-green-500/80 break-all h-16 overflow-y-auto custom-scrollbar">
            {hasKeys ? user.publicKeyString : "No keys generated..."}
          </div>
        </div>
      </div>
      
      {!hasKeys && (
         <div className="mt-3 text-xs text-red-400">
            Messages cannot be sent or received until keys are generated.
         </div>
      )}
    </div>
  );
};

export default KeyStatus;