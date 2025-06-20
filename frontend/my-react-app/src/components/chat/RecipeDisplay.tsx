import React from 'react';
import { ChefHat, ExternalLink } from 'lucide-react';

interface RecipeDisplayProps {
  content: string;
  showNotification: (message: string, type: 'success' | 'error') => void;
  onOpenEditor?: (content: string) => void;
}

const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/gi;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline inline-flex items-center gap-1 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
          <ExternalLink size={12} className="flex-shrink-0" />
        </a>
      );
    }
    return part;
  });
};

const RecipeDisplay: React.FC<RecipeDisplayProps> = ({
  content,
  showNotification,
  onOpenEditor
}) => {
  const lines = content.split('\n');
  const introLines: string[] = [];
  let cutoffIndex = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('###') || line.includes(':')) {
      cutoffIndex = i;
      break;
    }
    if (line !== '') {
      introLines.push(line);
    }
  }

  const firstSentence = introLines.join(' ');
  const recipeContent = lines.slice(cutoffIndex).join('\n').trim();

  const handleOpenEditor = () => {
    if (onOpenEditor) {
      onOpenEditor(content);
    }
  };

  return (
    <div className="space-y-3">
      <div>{renderTextWithLinks(firstSentence)}</div>
      {recipeContent && (
        <div className="border border-slate-600/50 rounded-xl overflow-hidden bg-slate-700/30 backdrop-blur-sm">
          <button
            onClick={handleOpenEditor}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-600/20 transition-colors"
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
