import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react';

interface ShoppingListDisplayProps {
  content: string;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const ShoppingListDisplay: React.FC<ShoppingListDisplayProps> = ({ content, showNotification }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const lines = content.split('\n');
  const firstSentence = lines[0];
  const shoppingListContent = lines.slice(1).join('\n').trim();
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shoppingListContent);
    showNotification('Shopping list copied to clipboard!', 'success');
  };
  
  return (
    <div className="space-y-3">
      <div>{firstSentence}</div>
      {shoppingListContent && (
        <div className="border border-slate-600/50 rounded-xl overflow-hidden bg-slate-700/30 backdrop-blur-sm">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-600/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <ShoppingCart size={18} className="text-green-400" />
              <span className="font-medium text-green-400">Shopping List</span>
            </div>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
          {isExpanded && (
            <div className="border-t border-slate-600/50 p-4 bg-slate-800/20">
              <pre className="whitespace-pre-wrap text-sm font-mono text-gray-200 leading-relaxed">
                {shoppingListContent}
              </pre>
              <button
                onClick={copyToClipboard}
                className="mt-3 px-3 py-1.5 text-xs bg-green-600/20 text-green-400 rounded-lg hover:bg-green-600/30 transition-colors border border-green-600/30"
              >
                Copy to Clipboard
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShoppingListDisplay;