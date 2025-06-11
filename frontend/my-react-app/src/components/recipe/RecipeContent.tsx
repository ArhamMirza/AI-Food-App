import React from 'react';
import { ChefHat } from 'lucide-react';

interface RecipeContentProps {
  title: string;
  content: string; // Assuming content is a string for simplicity
}

const RecipeContent: React.FC<RecipeContentProps> = ({ title, content }) => {
  return (
    <div className="flex gap-3 items-start px-4 py-3 max-w-2xl mx-auto">
      <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
        <ChefHat size={16} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-gray-200 text-sm whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
};

export default RecipeContent;