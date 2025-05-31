import React from 'react';
import { ChefHat, Sparkles, Home, Bot, Utensils, LogOut, Menu, X } from 'lucide-react';

interface NavItem {
  icon: JSX.Element;
  label: string;
  href: string;
}

interface SidebarNavProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

const SidebarNav: React.FC<SidebarNavProps> = ({ isSidebarOpen, setIsSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const navItems: NavItem[] = [
    { icon: <Home className="w-6 h-6" />, label: 'Dashboard', href: '#dashboard' },
    { icon: <Bot className="w-6 h-6" />, label: 'Recipes', href: '#recipes' },
    { icon: <Utensils className="w-6 h-6" />, label: 'Meal Plans', href: '#meal-plans' },
    { icon: <Utensils className="w-6 h-6" />, label: 'Community', href: '#community' },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 ${isCollapsed ? 'w-16' : 'w-64'} bg-black/95 backdrop-blur-sm border-r border-gray-800 z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300`}>
      <div className="p-4 h-full flex flex-col">
        {/* Logo and Collapse Button */}
        <div className="flex items-center justify-between mb-8">
          <div className={`flex items-center space-x-2 ${isCollapsed ? 'hidden' : 'block'}`}>
            <div className="relative">
              <ChefHat className="w-8 h-8 text-green-400" />
              <Sparkles className="w-4 h-4 text-green-300 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="text-xl font-bold">Food AI</span>
          </div>
          <button
            className="p-2 bg-gray-800/50 rounded-full hover:bg-gray-700/50 text-gray-300 hover:text-green-400 transition-all duration-200 cursor-pointer pointer-events-auto z-50"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>
        </div>
        <nav className="space-y-2 flex-1">
          {navItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-green-400 transition-all duration-200`}
            >
              {item.icon}
              {!isCollapsed && <span>{item.label}</span>}
            </a>
          ))}
        </nav>
        <button
          className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'} p-3 rounded-lg hover:bg-gray-800/50 text-gray-300 hover:text-green-400 transition-all duration-200 w-full text-left`}
          onClick={() => console.log('Logout')}
        >
          <LogOut className="w-6 h-6" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default SidebarNav;