import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Bot, Utensils, LogOut, Home, Plus, Calendar, Search, Menu, X, Maximize, Minimize, ChevronLeft, ChevronRight, Send, Loader } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/slices/userSlice';
import { fetchSavedRecipes } from '../redux/slices/savedRecipesSlice';
import SidebarNav from '../components/SideBarNav';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  icon: JSX.Element;
  label: string;
  href: string;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp?: Date;
}

interface ChatResponse {
  response: string;
  conversation_id: string;
}

interface ChatRequest {
  message: string;
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(state => state.user.user);
  const savedRecipes = useAppSelector(state => state.savedRecipes.recipes);
  const recipeDetails = useAppSelector(state => state.savedRecipes.recipeDetails);
  const mealPlans = useAppSelector(state => state.mealPlans.plans);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState<number>(0);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I assist you with your cooking today?', isUser: false, timestamp: new Date() },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:8000/api/v1';

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (user?.saved_recipes?.length) {
      dispatch(fetchSavedRecipes(user.saved_recipes));
    }
  }, [dispatch, user?.saved_recipes]);

  useEffect(() => {
    if (isChatOpen && conversationId) {
      loadConversationHistory();
    }
  }, [isChatOpen, conversationId]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadConversationHistory = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/chatbot/conversations/${conversationId}`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        if (data.messages && data.messages.length > 0) {
          const formattedMessages: Message[] = data.messages.map((msg: any, index: number) => ({
            id: index + 1,
            text: msg.content || msg.message,
            isUser: msg.role === 'user',
            timestamp: new Date(msg.timestamp || Date.now())
          }));
          setMessages(formattedMessages);
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const sendMessageToAPI = async (message: string): Promise<ChatResponse> => {
    const requestBody: ChatRequest = { message };
    const url = conversationId 
      ? `${API_BASE_URL}/chatbot/chat?conversation_id=${conversationId}`
      : `${API_BASE_URL}/chatbot/chat`;

    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage = newMessage.trim();
    const userMessageObj: Message = {
      id: messages.length + 1,
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessageObj]);
    setNewMessage('');
    setIsLoading(true);

    try {
      const response = await sendMessageToAPI(userMessage);
      
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
      }

      const botMessageObj: Message = {
        id: messages.length + 2,
        text: response.response,
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessageObj]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessageObj: Message = {
        id: messages.length + 2,
        text: 'Sorry, I encountered an error. Please try again later.',
        isUser: false,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearConversation = async () => {
    if (conversationId) {
      try {
        await fetch(`${API_BASE_URL}/chatbot/conversations/${conversationId}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (error) {
        console.error('Error deleting conversation:', error);
      }
    }
    
    setMessages([
      { id: 1, text: 'Hello! How can I assist you with your cooking today?', isUser: false, timestamp: new Date() }
    ]);
    setConversationId(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setWeekOffset(prev => direction === 'next' ? prev + 1 : prev - 1);
  };

  const navItems: NavItem[] = [
    { icon: <Home className="w-6 h-6" />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Bot className="w-6 h-6" />, label: 'Recipes', href: '/recipes' },
    { icon: <Calendar className="w-6 h-6" />, label: 'Meal Plans', href: '/meal-plans' },
    { icon: <Utensils className="w-6 h-6" />, label: 'Community', href: '/community' },
    { icon: <LogOut className="w-6 h-6" />, label: 'Logout', href: '#logout' },
  ];

  const currentDate = new Date();
  const startDate = new Date(currentDate);
  startDate.setDate(currentDate.getDate() + weekOffset * 7);
  const calendarDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    return {
      dateStr: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isCurrentDay: date.toDateString() === currentDate.toDateString(),
    };
  });

  const weekStart = calendarDays[0];
  const weekEnd = calendarDays[6];
  const weekHeader = `Your Meal Plan - ${weekStart.month} ${weekStart.dayNumber} - ${weekEnd.month} ${weekEnd.dayNumber}, ${currentDate.getFullYear()}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A1B3D] to-[#1A1A2E] text-white overflow-hidden flex">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#3A2F5F] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-[#4A406F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#5A517F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <SidebarNav 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <header className={`fixed top-0 right-0 z-40 transition-all duration-300 ${isCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'} ${scrollY > 50 ? 'bg-[#1A1A2E]/80 backdrop-blur-sm border-b border-[#3A2F5F]' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                className="md:hidden text-gray-300 hover:text-[#4CAF50] p-2"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center justify-end flex-1 space-x-4">
                <span className="text-gray-300 hidden sm:block text-sm">
                  Welcome, {user?.username || 'Guest'}!
                </span>
                <div className="w-10 h-10 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] rounded-full flex items-center justify-center">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-20 md:pt-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <section className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to Your <span className="text-[#4CAF50]">Cooking Hub</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl">
                Explore personalized recipes, plan your meals with our AI cooking assistant to elevate your cooking experience.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">AI Cooking Assistant</h2>
              <button
                onClick={() => navigate('/chat')}
                className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#4CAF50]/25 flex items-center justify-center w-full sm:w-auto"
              >
                <Bot className="w-5 h-5 mr-2" /> Chat Now
              </button>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#4CAF50]/25 flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2" /> New Recipe
                </button>
                <button className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] hover:bg-[#2A1B3D]/70 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center">
                  <Calendar className="w-5 h-5 mr-2" /> Plan Meal
                </button>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Saved Recipes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {savedRecipes.length > 0 ? (
                  savedRecipes.slice(0, 3).map((recipeId) => {
                    const recipe = recipeDetails[recipeId];
                    return (
                      <div
                        key={recipeId}
                        className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] rounded-2xl p-6 hover:bg-[#2A1B3D]/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#4CAF50]/10"
                      >
                        <h3 className="text-xl font-semibold mb-2">{recipe?.title || 'Loading...'}</h3>
                        <p className="text-gray-400 text-sm">{recipe?.ingredients?.length ? 'Recipe' : 'No details'}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400">No saved recipes yet.</p>
                )}
              </div>
            </section>

            <section className="mb-12">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-2xl font-semibold">{weekHeader}</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-2 bg-[#2A1B3D]/50 rounded-full hover:bg-[#3A2F5F] text-gray-300 hover:text-[#4CAF50] transition-all duration-200 cursor-pointer pointer-events-auto z-30"
                    onClick={() => navigateWeek('prev')}
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 bg-[#2A1B3D]/50 rounded-full hover:bg-[#3A2F5F] text-gray-300 hover:text-[#4CAF50] transition-all duration-200 cursor-pointer pointer-events-auto z-30"
                    onClick={() => navigateWeek('next')}
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] rounded-2xl p-6">
                <div className="grid grid-cols-1 sm:grid-cols-7 gap-4">
                  {calendarDays.map((day) => {
                    const meal = mealPlans[day.dateStr];
                    return (
                      <div key={day.dateStr} className="flex flex-col">
                        <div className="text-center text-gray-300 font-semibold mb-2">
                          {day.dayName}
                        </div>
                        <div
                          className={`p-4 rounded-lg ${
                            day.isCurrentDay
                              ? 'bg-[#4CAF50]/50 border border-[#66BB6A]'
                              : 'bg-[#2A1B3D]/70 hover:bg-[#3A2F5F]/50'
                          } transition-all duration-200 min-h-[120px] flex flex-col justify-between text-center`}
                        >
                          <div className="text-gray-300 font-semibold">
                            {day.month} {day.dayNumber}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{meal?.meal || 'No meal planned'}</p>
                          {meal ? (
                            <button className="text-[#4CAF50] hover:text-[#66BB6A] text-sm">View Recipe</button>
                          ) : (
                            <button className="text-[#4CAF50] hover:text-[#66BB6A] text-sm">Add Meal</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </div>
        </main>

        <footer className={`border-t border-[#3A2F5F] py-8 px-4 sm:px-6 lg:px-8 ${isCollapsed ? 'md:pl-20' : 'md:pl-68'}`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-[#4CAF50]" />
                <Sparkles className="w-4 h-4 text-[#4CAF50] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold">Food AI Assistant</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;