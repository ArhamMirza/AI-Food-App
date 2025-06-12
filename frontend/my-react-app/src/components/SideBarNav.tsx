import React from 'react';
import {
  ChefHat,
  Sparkles,
  LayoutDashboard,
  BookOpenText,
  CalendarCheck,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

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

const SidebarNav: React.FC<SidebarNavProps> = ({
  isSidebarOpen = false,
  setIsSidebarOpen = () => {},
  isCollapsed = false,
  setIsCollapsed = () => {},
}) => {
  const navItems: NavItem[] = [
    {
      icon: <LayoutDashboard className="w-6 h-6 flex-shrink-0" />,
      label: 'Dashboard',
      href: '#dashboard',
    },
    {
      icon: <BookOpenText className="w-6 h-6 flex-shrink-0" />,
      label: 'Recipes',
      href: '#recipes',
    },
    {
      icon: <CalendarCheck className="w-6 h-6 flex-shrink-0" />,
      label: 'Meal Plans',
      href: '#meal-plans',
    },
  ];

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const showText = !isCollapsed || isMobile;

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-0 md:inset-y-0 md:left-0 z-50
          ${isCollapsed ? 'w-full md:w-16' : 'w-full md:w-64'}
          bg-[#1A1A2E]/95 backdrop-blur-sm border-r border-[#3A2F5F]
          transform transition-all duration-300 ease-in-out
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="p-4 h-full flex flex-col">
          {/* Logo and Controls */}
          <div className="flex items-center justify-between mb-8">
            <div
              className={`
                flex items-center space-x-2 transition-all duration-300
                ${isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
              `}
            >
              <div className="relative">
                <ChefHat className="w-8 h-8 text-[#4CAF50] flex-shrink-0" />
                <Sparkles className="w-4 h-4 text-[#66BB6A] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold text-white whitespace-nowrap">Food AI</span>
            </div>

            {/* Collapse/Expand Buttons */}
            <button
              className="hidden md:flex p-2 bg-[#2A1B3D]/50 rounded-full hover:bg-[#3A2F5F] text-gray-300 hover:text-[#4CAF50] transition"
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </button>

            <button
              className="md:hidden p-2 bg-[#2A1B3D]/50 rounded-full hover:bg-[#3A2F5F] text-gray-300 hover:text-[#4CAF50] transition"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="space-y-2 flex-1">
            {navItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`
                  flex items-center p-3 rounded-lg 
                  hover:bg-[#2A1B3D]/50 text-gray-300 hover:text-[#4CAF50] 
                  transition duration-200
                  ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'}
                `}
                onClick={() => {
                  if (isMobile) setIsSidebarOpen(false);
                }}
              >
                {item.icon}
                <span
                  className={`
                    transition-all duration-300 whitespace-nowrap
                    ${isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
                  `}
                >
                  {item.label}
                </span>
              </a>
            ))}
          </nav>

          {/* Logout */}
          <button
            className={`
              flex items-center p-3 rounded-lg 
              hover:bg-[#2A1B3D]/50 text-gray-300 hover:text-[#4CAF50] 
              transition duration-200 w-full text-left
              ${isCollapsed && !isMobile ? 'justify-center' : 'space-x-3'}
            `}
            onClick={() => {
              console.log('Logout');
              if (isMobile) setIsSidebarOpen(false);
            }}
          >
            <LogOut className="w-6 h-6 flex-shrink-0" />
            <span
              className={`
                transition-all duration-300 whitespace-nowrap
                ${isCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'}
              `}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;