import { useState, useEffect } from 'react';
import useNotifications from '../components/chat/useNotifications';

// Define interfaces for type safety
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  conversation_id: string;
  user_id: string;
  title: string;
}

interface ApiResponse<T> {
  messages?: T;
  response?: string;
  conversation_id?: string;
}

interface NotificationHook {
  showNotification: (message: string, type: 'success' | 'error') => void;
}

const USER_ID = '683ac8b1dcd4216109341d9f';
const BASE_URL = 'http://localhost:8000/api/v1/chatbot/chat';

const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<boolean>(false);
  const [searchType, setSearchType] = useState<string>('');
  
  const { showNotification }: NotificationHook = useNotifications();

  const apiCall = async <T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    if (!response.ok) throw new Error(`API call failed: ${response.status}`);
    return response.json();
  };

  const fetchUserConversations = async (): Promise<void> => {
    try {
      setError(null);
      const data :any = await apiCall<Conversation[]>(`/user/${USER_ID}`);
      setConversations(Array.isArray(data) ? data : []);
      if (data.length > 0 && !selectedConversation) {
        await loadConversationMessages(data[0].conversation_id);
      }
    } catch (err) {
      setError('Failed to load conversations');
      showNotification('Failed to load conversations', 'error');
    }
  };

  const loadConversationMessages = async (conversationId: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const data = await apiCall<Message[]>(`/${conversationId}`);
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setSelectedConversation(conversationId);
    } catch (err) {
      setError('Failed to load messages');
      showNotification('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (): Promise<void> => {
    if (!input.trim() || !selectedConversation) return;

    const userMessage: Message = { role: 'user', content: input };
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
      
      const data = await apiCall<string>(`?${params}`, {
        method: 'POST',
        body: JSON.stringify({ message: input.trim() }),
      });
      
      setMessages(prev => [...prev, { role: 'assistant', content: data.response! }]);
      if (data.conversation_id && data.conversation_id !== selectedConversation) {
        setSelectedConversation(data.conversation_id);
        await fetchUserConversations();
      }
    } catch (error) {
      setError('Failed to send message');
      showNotification('Failed to send message', 'error');
      setMessages(prev => prev.filter(msg => msg !== userMessage));
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string): Promise<void> => {
    try {
      await apiCall(`/${conversationId}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
      if (selectedConversation === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      showNotification('Conversation deleted successfully', 'success');
    } catch (error) {
      showNotification('Failed to delete conversation', 'error');
    }
  };

  const startNewChat = async (title: string): Promise<void> => {
    if (!title.trim()) return;
    
    setLoading(true);
    try {
      const data = await apiCall<{ conversation_id: string }>(`/create?user_id=${USER_ID}`, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() }),
      });

      setMessages([]);
      setSelectedConversation(data.conversation_id ?? null);
      await fetchUserConversations();
      showNotification('New chat created successfully', 'success');
    } catch (error) {
      showNotification('Failed to start new chat', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateConversationTitle = async (conversationId: string, title: string): Promise<void> => {
    try {
      await apiCall(`/${conversationId}/title`, {
        method: 'PUT',
        body: JSON.stringify({ title: title.trim() }),
      });

      setConversations(prev => 
        prev.map(conv => 
          conv.conversation_id === conversationId ? { ...conv, title: title.trim() } : conv
        )
      );
      showNotification('Title updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update title', 'error');
    }
  };

  const toggleSearch = (type: string): void => {
    if (search && searchType === type) {
      setSearch(false);
      setSearchType('');
    } else {
      setSearch(true);
      setSearchType(type);
    }
  };

  useEffect(() => {
    fetchUserConversations();
  }, []);

  return {
    messages,
    input,
    setInput,
    loading,
    conversations,
    selectedConversation,
    error,
    search,
    searchType,
    sendMessage,
    loadConversationMessages,
    deleteConversation,
    startNewChat,
    updateConversationTitle,
    toggleSearch,
  };
};

export default useChat;