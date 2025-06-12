import React from 'react';
import { X, Loader2, Save } from 'lucide-react';

interface SaveRecipeModalProps {
  isOpen: boolean;
  title: string;
  loading: boolean;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onSave: (title: string) => void;
}

const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({
  isOpen,
  title,
  loading,
  onClose,
  onTitleChange,
  onSave,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-white">Save Recipe</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>
        <div className="mb-4">
          <label htmlFor="recipe-title" className="block text-sm text-gray-300 mb-2">
            Recipe Title
          </label>
          <input
            id="recipe-title"
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full bg-slate-900/50 text-white border border-slate-600/50 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500/50 text-sm"
            placeholder="Enter a title for your recipe..."
            disabled={loading}
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700/50 text-gray-300 rounded-lg hover:bg-slate-600/50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-all duration-200 flex items-center gap-2"
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Save Recipe
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveRecipeModal;