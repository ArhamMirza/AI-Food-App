import React from 'react';

interface NewChatModalProps {
  isOpen: boolean;
  title: string;
  loading: boolean;
  onClose: () => void;
  onTitleChange: (title: string) => void;
  onCreate: () => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
  isOpen,
  title,
  loading,
  onClose,
  onTitleChange,
  onCreate
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-slate-700/50 shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Start New Chat</h3>
        <input
          type="text"
          placeholder="Enter a title for your new chat..."
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 mb-4"
          onKeyDown={(e) => {
            if (e.key === 'Enter') onCreate();
            if (e.key === 'Escape') onClose();
          }}
          autoFocus
        />
        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors rounded-lg">
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!title.trim() || loading}
            className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 rounded-lg transition-all duration-200 font-medium"
          >
            {loading ? 'Creating...' : 'Create Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;