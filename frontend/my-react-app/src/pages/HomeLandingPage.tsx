import React, { useState, useEffect } from 'react';
import { ChefHat, Sparkles, Bot, Utensils, BookOpen, Users, Star, ArrowRight, Menu, X, Play } from 'lucide-react';

const HomeLandingPage: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <Bot className="w-8 h-8" />,
      title: "AI-Powered Recipes",
      description: "Get personalized recipe suggestions based on your preferences, dietary restrictions, and available ingredients."
    },
    {
      icon: <Utensils className="w-8 h-8" />,
      title: "Smart Meal Planning",
      description: "Plan your weekly meals effortlessly with our intelligent meal planning system that considers your schedule."
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "Cooking Guidance",
      description: "Step-by-step cooking instructions with tips and techniques to help you master any dish."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Community Recipes",
      description: "Share and discover amazing recipes from our community of food enthusiasts worldwide."
    }
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Home Chef",
      content: "This AI assistant has completely transformed how I cook. I discover new recipes every day!",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Food Blogger",
      content: "The personalized suggestions are incredible. It's like having a professional chef as my assistant.",
      rating: 5
    },
    {
      name: "Emma Davis",
      role: "Busy Parent",
      content: "Meal planning used to stress me out. Now it's the easiest part of my week!",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2A1B3D] to-[#1A1A2E] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#3A2F5F] rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-[#4A406F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-[#5A517F] rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-[#1A1A2E]/80 backdrop-blur-sm border-b border-[#3A2F5F]' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-[#4CAF50]" />
                <Sparkles className="w-4 h-4 text-[#66BB6A] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold">Food AI</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-[#4CAF50] transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-[#4CAF50] transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-300 hover:text-[#4CAF50] transition-colors">Reviews</a>
              <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] px-6 py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-gray-300 hover:text-[#4CAF50]"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-[#1A1A2E]/95 backdrop-blur-sm border-t border-[#3A2F5F]">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-[#4CAF50] transition-colors">Features</a>
              <a href="#how-it-works" className="block text-gray-300 hover:text-[#4CAF50] transition-colors">How It Works</a>
              <a href="#testimonials" className="block text-gray-300 hover:text-[#4CAF50] transition-colors">Reviews</a>
              <button className="w-full bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] px-6 py-2 rounded-lg font-semibold transition-all duration-200">
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 text-center">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] rounded-full flex items-center justify-center shadow-2xl shadow-[#4CAF50]/25">
                <ChefHat className="w-12 h-12 text-white" />
              </div>
              <Sparkles className="w-8 h-8 text-[#66BB6A] absolute -top-2 -right-2 animate-pulse" />
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Your Personal
            <span className="text-[#4CAF50] block mt-2">AI Chef Assistant</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Discover personalized recipes, plan meals effortlessly, and elevate your cooking game with the power of artificial intelligence.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#4CAF50]/25 flex items-center">
              Start Cooking Now <ArrowRight className="ml-2 w-5 h-5" />
            </button>
            <button className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] hover:bg-[#2A1B3D]/70 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105 flex items-center">
              <Play className="mr-2 w-5 h-5" /> Watch Demo
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4CAF50] mb-2">10K+</div>
              <div className="text-gray-400">Recipes Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4CAF50] mb-2">5K+</div>
              <div className="text-gray-400">Happy Cooks</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#4CAF50] mb-2">4.9★</div>
              <div className="text-gray-400">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Powerful Features for
              <span className="text-[#4CAF50] block mt-2">Modern Cooking</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Everything you need to transform your kitchen experience and become a better cook.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] rounded-2xl p-6 hover:bg-[#2A1B3D]/70 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-[#4CAF50]/10">
                <div className="w-12 h-12 bg-[#4CAF50]/20 rounded-lg flex items-center justify-center mb-4 text-[#4CAF50]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              How It <span className="text-[#4CAF50]">Works</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Get started in just three simple steps and transform your cooking experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { step: "1", title: "Tell Us Your Preferences", desc: "Share your dietary preferences, allergies, and favorite cuisines." },
              { step: "2", title: "Get AI Recommendations", desc: "Receive personalized recipe suggestions based on your profile." },
              { step: "3", title: "Start Cooking", desc: "Follow step-by-step instructions and enjoy delicious meals." }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] rounded-full flex items-center justify-center text-2xl font-bold mb-6 mx-auto shadow-lg shadow-[#4CAF50]/25">
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold mb-4">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                {index < 2 && (
                  <ArrowRight className="hidden md:block w-6 h-6 text-[#4CAF50] absolute top-8 -right-6 transform rotate-0" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              What Our <span className="text-[#4CAF50]">Users Say</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Join thousands of happy cooks who have transformed their kitchen experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-[#2A1B3D]/50 backdrop-blur-sm border border-[#3A2F5F] rounded-2xl p-6 hover:bg-[#2A1B3D]/70 transition-all duration-300">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-[#4CAF50] fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold">{testimonial.name}</div>
                  <div className="text-[#4CAF50] text-sm">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-[#4CAF50]/20 to-[#66BB6A]/20 backdrop-blur-sm border border-[#3A2F5F] rounded-3xl p-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Transform Your
              <span className="text-[#4CAF50] block mt-2">Cooking Experience?</span>
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of home cooks who are already using AI to create amazing meals every day.
            </p>
            <button className="bg-gradient-to-r from-[#4CAF50] to-[#66BB6A] hover:from-[#45a049] hover:to-[#5cb860] text-white px-10 py-4 rounded-lg font-semibold text-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-[#4CAF50]/25">
              Get Started Free Today
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#3A2F5F] py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="relative">
                <ChefHat className="w-8 h-8 text-[#4CAF50]" />
                <Sparkles className="w-4 h-4 text-[#66BB6A] absolute -top-1 -right-1 animate-pulse" />
              </div>
              <span className="text-xl font-bold">Food AI Assistant</span>
            </div>
            <div className="flex space-x-8 text-gray-400">
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Terms</a>
              <a href="#" className="hover:text-[#4CAF50] transition-colors">Support</a>
            </div>
          </div>
          <div className="border-t border-[#3A2F5F] mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Food AI Assistant. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomeLandingPage;