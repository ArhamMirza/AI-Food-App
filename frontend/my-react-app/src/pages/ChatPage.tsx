import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Loader2, Trash2, Menu, X, Plus, Edit3, Check, MessageSquare, Smartphone, ChevronDown, ChevronUp, ShoppingCart, ChefHat, Copy, Save, Globe, Youtube, Bookmark } from 'lucide-react';

import Sidebar from '../components/chat/Sidebar';
import ChatMessage from '../components/chat/ChatMessage';
import NewChatModal from '../components/chat/NewChatModal';
import Notification from '../components/chat/Notification';

// Hooks
import useNotifications from '../components/chat/useNotifications';

// Types
import type { Message, Conversation } from '../components/chat/types';

// SaveRecipeModal Component
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

const USER_ID = '683ac8b1dcd4216109341d9f';
const BASE_URL = 'http://localhost:8000/api/v1/chatbot/chat';

// Utility function to extract recipe content (skip first sentence)
const extractRecipeContent = (content: string): string => {
  const sentences = content.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 1) return content;
  return sentences.slice(1).join(' ').trim();
};

// Utility function to reconstruct full content with edited recipe
const reconstructFullContent = (originalContent: string, editedRecipe: string): string => {
  const sentences = originalContent.split(/(?<=[.!?])\s+/);
  if (sentences.length <= 1) return editedRecipe;
  return `${sentences[0]} ${editedRecipe}`.trim();
};

// Main Chat Component
const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [search, setSearch] = useState(false);
  const [searchType, setSearchType] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [editingMessageIndex, setEditingMessageIndex] = useState<number | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveRecipeModal, setShowSaveRecipeModal] = useState(false);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeContentToSave, setRecipeContentToSave] = useState<string | null>(null);

  const { notifications, showNotification, removeNotification } = useNotifications();

  const chatRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handler to save recipe
  const handleSaveRecipe = (content: string) => {
    const confirmed = window.confirm('Do you want to add this recipe to your saved recipes?');
    if (!confirmed) return;

    // Open the modal and store the content to save
    setRecipeContentToSave(content);
    setRecipeTitle(content.substring(0, 50) + (content.length > 50 ? '...' : '')); // Pre-fill title
    setShowSaveRecipeModal(true);
  };

  // Handler to confirm saving recipe with title
  const handleConfirmSaveRecipe = async (title: string) => {
    if (!recipeContentToSave || !title.trim()) return;

    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/save-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          content: recipeContentToSave,
          title: title.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to save recipe');
      showNotification('Recipe saved successfully!', 'success');
      setShowSaveRecipeModal(false);
      setRecipeTitle('');
      setRecipeContentToSave(null);
    } catch (error) {
      console.error('Save recipe error:', error);
      showNotification('Failed to save recipe', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Split view handlers
  const handleOpenEditor = (content: string, messageIndex?: number) => {
    setOriginalContent(content);
    const recipeContent = extractRecipeContent(content);
    setEditorContent(recipeContent);
    setEditingMessageIndex(messageIndex ?? null);
    setEditorOpen(true);
    setHasUnsavedChanges(false);
  };

  const handleCloseEditor = () => {
    if (hasUnsavedChanges) {
      const shouldClose = window.confirm('You have unsaved changes. Are you sure you want to close the editor?');
      if (!shouldClose) return;
    }
    
    setEditorOpen(false);
    setEditorContent('');
    setOriginalContent('');
    setEditingMessageIndex(null);
    setHasUnsavedChanges(false);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(editorContent);
    showNotification('Recipe copied to clipboard!', 'success');
  };

  const handleSaveContent = async () => {
    try {
      if (editingMessageIndex !== null && selectedConversation) {
        const updatedFullContent = reconstructFullContent(originalContent, editorContent);
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[editingMessageIndex] = {
            ...newMessages[editingMessageIndex],
            content: updatedFullContent
          };
          return newMessages;
        });

        try {
          const response = await fetch(`${BASE_URL}/${selectedConversation}/message/${editingMessageIndex}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              content: updatedFullContent,
              role: messages[editingMessageIndex]?.role || 'assistant'
            }),
          });

          if (!response.ok) throw new Error(`Server responded with status: ${response.status}`);
          showNotification('Recipe updated successfully!', 'success');
          setHasUnsavedChanges(false);
          setOriginalContent(updatedFullContent);

        } catch (serverError) {
          console.error('Failed to save to server:', serverError);
          showNotification('Recipe updated locally (server sync failed)', 'warning');
          setHasUnsavedChanges(false);
        }
      } else {
        localStorage.setItem('saved-recipe', editorContent);
        showNotification('Recipe saved locally!', 'success');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Save error:', error);
      showNotification('Failed to save recipe', 'error');
    }
  };

  const handleEditorContentChange = (content: string) => {
    setEditorContent(content);
    setHasUnsavedChanges(true);
  };

  const handleWebToggle = () => {
    if (search && searchType === 'web') {
      setSearch(false);
      setSearchType('');
    } else {
      setSearch(true);
      setSearchType('web');
    }
  };

  const handleYouTubeToggle = () => {
    if (search && searchType === 'youtube') {
      setSearch(false);
      setSearchType('');
    } else {
      setSearch(true);
      setSearchType('youtube');
    }
  };

  const fetchUserConversations = async () => {
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/user/${USER_ID}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedConversation) {
        loadConversationMessages(data[0].conversation_id);
      }
    } catch (err) {
      setError('Failed to load conversations');
      showNotification('Failed to load conversations', 'error');
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${BASE_URL}/${conversationId}`);
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelectedConversation(conversationId);
      setSidebarOpen(false);
    } catch (err) {
      setError('Failed to load messages');
      showNotification('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const params = new URLSearchParams({
        user_id: USER_ID,
        conversation_id: selectedConversation,
        search: search.toString(),
        search_type: searchType,
      });
      const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!res.ok) throw new Error('Failed to send message');
      const data = await res.json();
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.conversation_id !== selectedConversation) {
        setSelectedConversation(data.conversation_id);
        fetchUserConversations();
      }
    } catch (error) {
      setError('Failed to send message');
      showNotification('Failed to send message', 'error');
      setMessages(prev => prev.filter(msg => msg !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      await fetch(`${BASE_URL}/${conversationId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      showNotification('Conversation deleted successfully', 'success');
    } catch (error) {
      setError('Failed to delete conversation');
      showNotification('Failed to delete conversation', 'error');
    }
  };

  const startNewChat = async () => {
    if (!newChatTitle.trim()) return;
    
    setLoading(true);
    setShowNewChatModal(false);
    
    try {
      const res = await fetch(`${BASE_URL}/create?user_id=${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newChatTitle.trim() }),
      });

      const data = await res.json();
      setMessages([]);
      setSelectedConversation(data.conversation_id);
      setNewChatTitle('');
      await fetchUserConversations();
      showNotification('New chat created successfully', 'success');
    } catch (error) {
      setError('Failed to start new chat');
      showNotification('Failed to start new chat', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string) => {
    try {
      await fetch(`${BASE_URL}/${conversationId}/title`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId ? { ...conv, title: title.trim() } : conv
        )
      );
      setEditingTitle(null);
      setEditTitle('');
      showNotification('Conversation title updated successfully', 'success');
    } catch (error) {
      setError('Failed to update title');
      showNotification('Failed to update title', 'error');
    }
  };

  useEffect(() => { fetchUserConversations(); }, []);
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, #10b981 0%, #059669 100%);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(180deg, #34d399 0%, #10b981 100%);
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #10b981 transparent;
          }
        `}
      </style>
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      
      <Sidebar 
        isOpen={sidebarOpen}
        conversations={conversations}
        selectedConversation={selectedConversation}
        error={error}
        editingTitle={editingTitle}
        editTitle={editTitle}
        onClose={() => setSidebarOpen(false)}
        onNewChat={() => setShowNewChatModal(true)}
        onSelectConversation={loadConversationMessages}
        onEditTitle={(id, title) => { setEditingTitle(id); setEditTitle(title || ''); }}
        onSaveTitle={updateConversationTitle}
        onCancelEdit={() => { setEditingTitle(null); setEditTitle(''); }}
        onDeleteConversation={deleteConversation}
        onEditTitleChange={setEditTitle}
      />

      <div className="flex flex-1 min-w-0">
        <div className={`transition-all duration-300 ${editorOpen ? 'w-1/2' : 'w-full'} flex flex-col`}>
          <header className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white transition-colors p-2 -ml-2">
                <Menu size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold">Chat with Food AI</h1>
                {selectedConversation && (
                  <p className="text-xs text-gray-400 mt-1">
                    {conversations.find(c => c.conversation_id === selectedConversation)?.title || 'Untitled Chat'}
                  </p>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-gray-400">
              <Smartphone size={14} />
              <span>Mobile Optimized</span>
            </div>
          </header>

          <div ref={chatRef} className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gradient-to-b from-transparent to-slate-900/20 custom-scrollbar">
            {!selectedConversation ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare size={28} className="text-white" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Welcome to Food AI</h2>
                  <p className="text-gray-400 mb-6">Select a conversation or start a new chat to begin!</p>
                  <button
                    onClick={() => setShowNewChatModal(true)}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                  >
                    Start New Chat
                  </button>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => {
                  if (idx === 0) return null;
                  return (
                    <ChatMessage
                      key={idx}
                      message={msg}
                      index={idx}
                      showNotification={showNotification}
                      onOpenEditor={(content) => handleOpenEditor(content, idx)}
                      onSaveRecipe={() => handleSaveRecipe(msg.content)}
                    />
                  );
                })}

                {loading && (
                  <div className="flex items-center gap-3 text-gray-400 px-4">
                    <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center">
                      <Loader2 className="animate-spin" size={14} />
                    </div>
                    <span className="text-sm">Food AI is thinking...</span>
                  </div>
                )}
              </>
            )}
          </div>

          <footer className="p-4 border-t border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <div className="flex items-end gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  className="w-full resize-none rounded-2xl bg-slate-800/80 text-white px-4 py-3 pr-12 border border-slate-700/50 focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/20 backdrop-blur-sm transition-all duration-200 text-sm placeholder-gray-400"
                  placeholder={selectedConversation ? "Ask about recipes, meal planning, or cooking tips..." : "Select a chat to start messaging"}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={!selectedConversation || loading}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
                <div className="absolute bottom-3 right-3 flex gap-2">
                  <button
                    onClick={handleWebToggle}
                    className={`p-2 rounded-lg transition-colors ${
                      search && searchType === 'web'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50'
                    }`}
                    title="Search Web"
                    disabled={!selectedConversation || loading}
                  >
                    <Globe size={16} />
                  </button>
                  <button
                    onClick={handleYouTubeToggle}
                    className={`p-2 rounded-lg transition-colors ${
                      search && searchType === 'youtube'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-600/50'
                    }`}
                    title="Search YouTube"
                    disabled={!selectedConversation || loading}
                  >
                    <Youtube size={16} />
                  </button>
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading || !selectedConversation}
                className="w-12 h-12 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.05] disabled:transform-none"
              >
                <SendHorizontal size={18} className="text-white" />
              </button>
            </div>
          </footer>
        </div>

        {editorOpen && (
          <div className="w-1/2 border-l border-slate-600/50 bg-slate-800/50 backdrop-blur-sm flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-600/50">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <ChefHat size={20} className="text-blue-400" />
                <span>Recipe Editor</span>
                {hasUnsavedChanges && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                    Unsaved
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyContent}
                  className="p-2 text-blue-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Copy recipe to clipboard"
                >
                  <Copy size={18} />
                </button>
                <button
                  onClick={handleSaveContent}
                  className={`p-2 rounded-lg transition-colors ${
                    hasUnsavedChanges 
                      ? 'text-green-400 hover:bg-green-400/10 bg-green-400/5' 
                      : 'text-green-400 hover:bg-slate-700/50'
                  }`}
                  title={editingMessageIndex !== null ? "Save changes to database" : "Save recipe locally"}
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={handleCloseEditor}
                  className="p-2 text-gray-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                  title="Close editor"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {editingMessageIndex !== null && (
              <div className="px-4 py-2 bg-blue-500/10 border-b border-slate-600/50">
                <p className="text-sm text-blue-400">
                  Editing message #{editingMessageIndex + 1} • Changes will be saved to database and chat
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Note: First sentence is preserved and not editable
                </p>
              </div>
            )}

            <div className="flex-1 p-4">
              <textarea
                value={editorContent}
                onChange={(e) => handleEditorContentChange(e.target.value)}
                className="w-full h-full bg-slate-900/50 text-gray-100 border border-slate-600/50 rounded-lg p-4 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none custom-scrollbar"
                placeholder="Recipe content will appear here (excluding the first sentence)..."
              />
            </div>

            <div className="p-4 border-t border-slate-600/50 bg-slate-900/30">
              <div className="text-xs text-gray-400 space-y-1">
                <p>• Recipe content excludes the first sentence from the original message</p>
                <p>• Save will update both the chat message and database</p>
                <p>• Message will remain expandable after editing</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <NewChatModal 
        isOpen={showNewChatModal}
        title={newChatTitle}
        loading={loading}
        onClose={() => { setShowNewChatModal(false); setNewChatTitle(''); }}
        onTitleChange={setNewChatTitle}
        onCreate={startNewChat}
      />

      <SaveRecipeModal
        isOpen={showSaveRecipeModal}
        title={recipeTitle}
        loading={loading}
        onClose={() => {
          setShowSaveRecipeModal(false);
          setRecipeTitle('');
          setRecipeContentToSave(null);
        }}
        onTitleChange={setRecipeTitle}
        onSave={handleConfirmSaveRecipe}
      />

      {notifications.map(({ id, message, type }) => (
        <Notification key={id} message={message} type={type} onClose={() => removeNotification(id)} />
      ))}
    </div>
  );
};

export default ChatPage;