import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Bot, Utensils, LogOut, Home, Plus, Calendar, Search, Menu, X, MessageSquare, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../redux/hooks';
import { logout } from '../redux/slices/userSlice';
import { fetchSavedRecipes } from '../redux/slices/savedRecipesSlice';
import SidebarNav from '../components/SideBarNav';

interface NavItem {
  icon: JSX.Element;
  label: string;
  href: string;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
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
    { id: 1, text: 'Hello! How can I assist you with your cooking today?', isUser: false },
  ]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [weekOffset, setWeekOffset] = useState<number>(0);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      setMessages([...messages, { id: messages.length + 1, text: newMessage, isUser: true }]);
      setNewMessage('');
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: 'Let me find a recipe for you!', isUser: false },
        ]);
      }, 500);
    }
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
    <div className="min-h-screen bg-black text-white overflow-hidden flex">
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <SidebarNav 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${isCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        <header className={`fixed top-0 right-0 z-40 transition-all duration-300 ${isCollapsed ? 'left-0 md:left-16' : 'left-0 md:left-64'} ${scrollY > 50 ? 'bg-black/80 backdrop-blur-sm border-b border-gray-800' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <button
                className="md:hidden text-gray-300 hover:text-white"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center space-x-4 flex-1 justify-end md:justify-between">
                <div className="relative w-full max-w-md hidden md:block">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search recipes..."
                    className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-300 hidden sm:block">Welcome, {user?.username || 'Guest'}!</span>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="md:hidden px-4 pb-4">
              <div className="relative w-full">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipes..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pt-20 md:pt-24 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <section className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Welcome to Your <span className="text-green-400">Cooking Hub</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl">
                Explore personalized recipes, plan your meals, and connect with the community to elevate your cooking experience.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
                <button className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 flex items-center justify-center">
                  <Plus className="w-5 h-5 mr-2" /> New Recipe
                </button>
                <button className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 text-white px-6 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center justify-center">
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
                        className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:bg-gray-800/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-green-500/10"
                      >
                        <h3 className="text-xl font-semibold mb-2">{recipe?.title || 'Loading...'}</h3>
                        <p className="text-gray-400">{recipe?.ingredients?.length ? 'Recipe' : 'No details'}</p>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-400">No saved recipes yet.</p>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6 relative z-10">
                <h2 className="text-2xl font-semibold">{weekHeader}</h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-green-400 transition-all duration-200 cursor-pointer pointer-events-auto z-30"
                    onClick={() => navigateWeek('prev')}
                    aria-label="Previous week"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-green-400 transition-all duration-200 cursor-pointer pointer-events-auto z-30"
                    onClick={() => navigateWeek('next')}
                    aria-label="Next week"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6">
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
                              ? 'bg-green-600/50 border border-green-500'
                              : 'bg-gray-800/50 hover:bg-gray-700/50'
                          } transition-all duration-200 min-h-[120px] flex flex-col justify-between text-center`}
                        >
                          <div className="text-gray-300 font-semibold">
                            {day.month} {day.dayNumber}
                          </div>
                          <p className="text-gray-400 text-sm mb-2">{meal?.meal || 'No meal planned'}</p>
                          {meal ? (
                            <button className="text-green-400 hover:text-green-300 text-sm">View Recipe</button>
                          ) : (
                            <button className="text-green-400 hover:text-green-300 text-sm">Add Meal</button>
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

        <button
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-green-500/25 transition-all duration-200 z-50"
          onClick={() => setIsChatOpen(!isChatOpen)}
        >
          <MessageSquare className="w-6 h-6 text-white" />
        </button>

        {isChatOpen && (
          <div
            className={`fixed bottom-20 right-6 ${
              isChatExpanded ? 'w-full md:w-[600px] max-h-[90vh]' : 'w-80 md:w-96 max-h-[70vh]'
            } bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl shadow-green-500/10 z-50 flex flex-col transition-all duration-300`}
          >
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-green-400" />
                <span className="font-semibold text-green-400">Cooking Assistant</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  className="text-gray-300 hover:text-white"
                  onClick={() => setIsChatExpanded(!isChatExpanded)}
                >
                  {isChatExpanded ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                <button
                  className="text-gray-300 hover:text-white"
                  onClick={() => setIsChatOpen(false)}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      message.isUser
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-800/50 text-gray-300'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-800">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Ask about recipes..."
                  className="flex-1 p-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <button
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg"
                  onClick={handleSendMessage}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}

        <footer className={`border-t border-gray-800 py-8 px-4 transition-all duration-300 ${isCollapsed ? 'md:pl-20' : 'md:pl-8'}`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-green-400" />
                <Sparkles className="w-4 h-4 text-green-400 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold">Food AI Assistant</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#" className="hover:text-green-400 transition-colors">Privacy</a>
              <a href="#" className="hover:text-green-400 transition-colors">Terms</a>
              <a href="#" className="hover:text-green-400 transition-colors">Support</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Dashboard;