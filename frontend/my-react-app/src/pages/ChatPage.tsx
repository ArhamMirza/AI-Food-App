import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal, Loader2, Trash2 } from 'lucide-react';

type Message = { role: string; content: string };
type Conversation = { conversation_id: string; title?: string };

const USER_ID = '683ac8b1dcd4216109341d9f'; // Replace with actual user id logic
const BASE_URL = 'http://localhost:8000/api/v1/chatbot/chat';

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUserConversations();
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const fetchUserConversations = async () => {
    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/user/${USER_ID}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'No conversations found' : `Failed to load conversations: ${res.status}`);
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid conversations data format');
      }
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        loadConversationMessages(data[0].conversation_id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err.message || 'Failed to load conversations. Please try again.');
    }
  };

  const loadConversationMessages = async (conversationId: string) => {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch(`${BASE_URL}/${conversationId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Conversation not found' : `Failed to load messages: ${res.status}`);
      }
      const data = await res.json();
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelectedConversation(conversationId);
    } catch (err) {
      console.error('Error loading messages:', err);
      setError(err.message || 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        user_id: USER_ID,
        conversation_id: selectedConversation,
      });

      const res = await fetch(`${BASE_URL}?${params.toString()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error(res.status === 400 ? 'Invalid message' : `Failed to send message: ${res.status}`);
      }
      const data = await res.json();
      if (!data.response) {
        throw new Error('Invalid response from server');
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);

      if (data.conversation_id && data.conversation_id !== selectedConversation) {
        setSelectedConversation(data.conversation_id);
        fetchUserConversations();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message. Please try again.');
      setMessages((prev) => prev.filter((msg) => msg !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!window.confirm('Are you sure you want to delete this conversation?')) return;

    try {
      setError(null);
      const res = await fetch(`${BASE_URL}/${conversationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        throw new Error(res.status === 404 ? 'Conversation not found' : `Failed to delete conversation: ${res.status}`);
      }

      setConversations((prev) => prev.filter((c) => c.conversation_id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      setError(error.message || 'Failed to delete conversation. Please try again.');
    }
  };

  const startNewChat = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/create?user_id=${USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        throw new Error(`Failed to start new chat: ${res.status}`);
      }

      const data = await res.json();

      if (!data.conversation_id) {
        throw new Error('No conversation_id returned from server');
      }

      setMessages([]);
      setSelectedConversation(data.conversation_id);
      await fetchUserConversations();
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError(error.message || 'Failed to start new chat. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-black via-gray-900 to-gray-950 text-white">
      <aside className="w-64 p-4 border-r border-gray-800 bg-black/70 flex flex-col">
        <div className="flex justify-between items-center text-green-400 font-bold text-xl mb-6">
          <span>Food AI</span>
          <button
            onClick={startNewChat}
            className="text-green-400 hover:text-green-600 font-semibold text-sm"
            title="Start New Chat"
          >
            + New Chat
          </button>
        </div>

        <nav className="flex flex-col gap-2 overflow-y-auto flex-1">
          {error && <p className="text-red-400 text-sm p-2">{error}</p>}
          {conversations.length === 0 && !error && (
            <p className="text-gray-400 text-sm">No conversations yet</p>
          )}
          {conversations.map(({ conversation_id, title }) => (
            <div
              key={conversation_id}
              className={`flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors ${
                selectedConversation === conversation_id
                  ? 'bg-green-700 text-white'
                  : 'hover:bg-green-800 text-green-300'
              }`}
              onClick={() => loadConversationMessages(conversation_id)}
            >
              <span className="truncate">{title || conversation_id}</span>
              <button
                className="p-1 hover:text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(conversation_id);
                }}
                aria-label="Delete conversation"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </nav>

        <nav className="mt-6 flex flex-col gap-4 text-sm">
          <a href="/dashboard" className="hover:text-green-500">Dashboard</a>
          <a href="/recipes" className="hover:text-green-500">Recipes</a>
          <a href="/meal-plans" className="hover:text-green-500">Meal Plans</a>
          <a href="/logout" className="mt-auto text-red-400 hover:text-red-600">Logout</a>
        </nav>
      </aside>

      <div className="flex flex-col flex-1">
        <header className="p-4 border-b border-gray-800 text-xl font-semibold bg-black/50">
          Chat with Food AI
        </header>

        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 text-sm bg-black/30"
        >
          {messages
            .filter((msg) => msg.role !== 'system')
            .map((msg, idx) => {
              const baseClasses = 'max-w-xl px-4 py-2 rounded-xl whitespace-pre-wrap';
              const userClasses = 'bg-green-700 text-white self-end ml-auto';
              const assistantClasses = 'bg-gray-800 text-gray-100 self-start';
              const className =
                msg.role === 'user' ? `${baseClasses} ${userClasses}` : `${baseClasses} ${assistantClasses}`;

              return (
                <div key={idx} className={className}>
                  {msg.content}
                </div>
              );
            })}
          {loading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="animate-spin" size={16} /> Thinking...
            </div>
          )}
          {error && <div className="text-red-400 text-sm">{error}</div>}
        </div>

        <footer className="p-4 border-t border-gray-800 bg-black/50">
          <div className="flex items-center gap-2">
            <textarea
              rows={1}
              className="flex-1 resize-none rounded-lg bg-gray-900 text-white p-2 border border-gray-700 focus:outline-none focus:border-green-500"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={!selectedConversation || loading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading || !selectedConversation}
              className="p-2 rounded-lg bg-green-700 hover:bg-green-800 disabled:opacity-50"
              aria-label="Send message"
            >
              <SendHorizontal size={20} />
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChatPage;
