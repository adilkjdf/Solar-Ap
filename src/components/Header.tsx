import React from 'react';
import { Sun, BookOpen, Package, Zap } from 'lucide-react';

type View = 'dashboard' | 'project' | 'library_modules' | 'library_inverters';

interface HeaderProps {
  onNavigate: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  return (
    <header className="bg-gray-800 text-white p-4 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-500 rounded-lg">
            <Sun className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HelioScope</h1>
            <p className="text-sm text-gray-300">Solar Project Designer</p>
          </div>
        </div>
        <nav className="hidden md:flex items-center space-x-2">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors"
          >
            Dashboard
          </button>
          
          <div className="relative group">
            <button className="px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Library</span>
            </button>
            <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 
                           opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-200 z-50">
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigate('library_modules'); }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Package className="w-4 h-4 mr-2" />
                Modules
              </a>
              <a 
                href="#" 
                onClick={(e) => { e.preventDefault(); onNavigate('library_inverters'); }}
                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Zap className="w-4 h-4 mr-2" />
                Inverters
              </a>
            </div>
          </div>

          <button className="px-4 py-2 text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg transition-colors">
            Help
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;