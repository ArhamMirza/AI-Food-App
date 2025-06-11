import React from 'react';
import { ChefHat, ExternalLink } from 'lucide-react';

interface RecipeDisplayProps {
  content: string;
  showNotification: (message: string, type: 'success' | 'error') => void;
  onOpenEditor?: (content: string) => void;
}

// Utility to detect and convert URLs to clickable links
const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/(?:[-\w.])+(:\d+)?(?:\/[\w\/_.]*)?(?:\?[\w&=%.]*)?(?:#[\w.-]*)?)/gi;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = urlRegex.exec(text)) !== null) {
    const start = match.index;
    const end = urlRegex.lastIndex;

    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }

    parts.push(
      <a
        key={`link-${start}`}
        href={match[0]}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 break-words"
        onClick={(e) => e.stopPropagation()}
      >
        {match[0]}
        <ExternalLink size={12} className="flex-shrink-0" />
      </a>
    );

    lastIndex = end;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length ? parts : text;
};

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({
  content,
  showNotification,
  onOpenEditor
}) => {
  const lines = content.split('\n');
  const title = lines[0];
  const body = lines.slice(1).join('\n').trim();

  const handleOpenEditor = () => {
    if (onOpenEditor) {
      onOpenEditor(content);
    }
  };

  return (
    <div className="space-y-4 text-slate-100">
      {/* Title section */}
      <h2 className="text-xl font-semibold text-slate-200 leading-snug">
        {renderTextWithLinks(title)}
      </h2>

      {/* Recipe content preview */}
      {body && (
        <div className="rounded-xl bg-slate-800/40 border border-slate-600/40 overflow-hidden shadow-sm">
          <div className="p-4">
            <pre className="whitespace-pre-wrap font-mono text-sm text-slate-300 leading-relaxed">
              {body}
            </pre>
          </div>

          <button
            onClick={handleOpenEditor}
            className="flex items-center justify-between w-full p-3 bg-slate-700/40 hover:bg-slate-600/30 transition-colors border-t border-slate-600/30"
          >
            <div className="flex items-center gap-2">
              <ChefHat size={18} className="text-blue-400" />
              <span className="font-medium text-blue-400">Open Recipe Editor</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeDisplay;
