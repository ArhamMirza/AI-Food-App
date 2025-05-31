import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Search, Menu, X, MessageSquare, Save, Bot } from 'lucide-react';
import SidebarNav from '../components/SideBarNav';

interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

const CreateRecipe: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [scrollY, setScrollY] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! Need help crafting a recipe? Suggest ingredients or a cuisine!', isUser: false },
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [recipeText, setRecipeText] = useState('');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSendMessage = () => {
    if (newMessage.trim() !== '') {
      setMessages([...messages, { id: messages.length + 1, text: newMessage, isUser: true }]);
      setNewMessage('');
      // Simulate bot response
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: prev.length + 1, text: 'How about a spicy Thai curry? I can suggest ingredients!', isUser: false },
        ]);
      }, 500);
    }
  };

  const handleSaveRecipe = () => {
    console.log('Saving recipe:', recipeText);
    // Placeholder for save logic (e.g., API call)
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-green-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-green-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-green-600 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      <SidebarNav isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Header */}
        <header className={`fixed top-0 left-0 md:left-64 right-0 z-40 transition-all duration-300 ${scrollY > 50 ? 'bg-black/80 backdrop-blur-sm border-b border-gray-800' : ''}`}>
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
                  <span className="text-gray-300 hidden sm:block">Welcome, User!</span>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
            {/* Mobile Search Bar */}
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

        {/* Main Content */}
        <main className="flex-1 pt-20 md:pt-24 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-8">
              Create a New <span className="text-green-400">Recipe</span>
            </h1>
            <div className="flex flex-col sm:flex-row gap-6 h-[calc(100vh-12rem)]">
              {/* Chat Interface */}
              <div className="w-full sm:w-2/5 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl shadow-green-500/10 flex flex-col">
                <div className="p-4 border-b border-gray-800 flex items-center space-x-2">
                  <Bot className="w-6 h-6 text-green-400" />
                  <span className="font-semibold text-green-400">Cooking Assistant</span>
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
                      placeholder="Ask for recipe ideas..."
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

              {/* Text Editor */}
              <div className="w-full sm:w-3/5 bg-gray-900/95 backdrop-blur-sm border border-gray-800 rounded-2xl shadow-2xl shadow-green-500/10 flex flex-col">
                <div className="p-4 border-b border-gray-800">
                  <h2 className="text-xl font-semibold text-green-400">Recipe Editor</h2>
                </div>
                <div className="flex-1 p-4">
                  <textarea
                    value={recipeText}
                    onChange={(e) => setRecipeText(e.target.value)}
                    placeholder="Enter your recipe here...\n\nTitle: \nIngredients:\n- \nInstructions:\n1. "
                    className="w-full h-full bg-gray-900/50 border border-gray-800 rounded-lg p-4 text-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                  />
                </div>
                <div className="p-4 border-t border-gray-800 flex justify-end">
                  <button
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2 rounded-lg font-semibold flex items-center space-x-2"
                    onClick={handleSaveRecipe}
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Recipe</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-800 py-8 px-4 md:pl-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-green-400" />
                <Sparkles className="w-4 h-4 text-green-300 absolute -top-1 -right-1 animate-pulse" />
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

export default CreateRecipe;