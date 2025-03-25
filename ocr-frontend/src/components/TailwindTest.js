import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

const TailwindTest = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`p-4 rounded-lg shadow-lg ${darkMode ? 'bg-primary-dark text-white' : 'bg-primary text-white'}`}>
        <h2 className="mb-2 text-shadow">Tailwind CSS Test</h2>
        <p className="text-sm">If you can see this styled box, Tailwind CSS is working!</p>
        
        <div className="mt-3 flex flex-col space-y-2">
          <h3 className="text-gradient font-bold">Theme Mode: {darkMode ? 'Dark' : 'Light'}</h3>
          
          <div className="flex space-x-2">
            <button 
              onClick={toggleDarkMode} 
              className={`btn ${darkMode ? 'bg-accent hover:bg-blue-400' : 'bg-primary-light hover:bg-primary-dark'} text-white`}
            >
              Toggle Theme
            </button>
            <button className="btn btn-secondary dark:text-white">Secondary</button>
          </div>
          
          <div className="mt-2 flex space-x-2">
            <div className="w-4 h-4 rounded-full bg-primary-light"></div>
            <div className="w-4 h-4 rounded-full bg-primary"></div>
            <div className="w-4 h-4 rounded-full bg-primary-dark"></div>
            <div className="w-4 h-4 rounded-full bg-accent"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest; 