import React from 'react';
import { Edit3, Check, X, Trash2 } from 'lucide-react';

interface Recipe {
  recipe_id: string;
  title: string;
}

interface RecipeItemProps {
  recipe: Recipe;
  isSelected: boolean;
  isEditing: boolean;
  editTitle: string;
  onSelect: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onEditTitleChange: (title: string) => void;
}

const RecipeItem: React.FC<RecipeItemProps> = ({
  recipe,
  isSelected,
  isEditing,
  editTitle,
  onSelect,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  onEditTitleChange,
}) => (
  <div
    className={`group relative rounded-xl transition-all duration-200 ${
      isSelected
        ? 'bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30 shadow-lg'
        : 'border border-transparent hover:bg-slate-700/50'
    }`}
  >
    {isEditing ? (
      <div className="flex items-center gap-2 p-3">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => onEditTitleChange(e.target.value)}
          className="flex-1 bg-slate-800 text-white text-sm px-2 py-1 rounded border border-slate-600 focus:border-green-500 focus:outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSave();
            if (e.key === 'Escape') onCancel();
          }}
          autoFocus
        />
        <button onClick={onSave} className="text-green-400 hover:text-green-300 p-1">
          <Check size={14} />
        </button>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-300 p-1">
          <X size={14} />
        </button>
      </div>
    ) : (
      <div className="flex items-center justify-between p-3 cursor-pointer" onClick={onSelect}>
        <span className="flex-1 text-sm font-medium truncate pr-2">{recipe.title}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-gray-400 hover:text-blue-400 p-1 rounded transition-colors"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    )}
  </div>
);

export default RecipeItem;