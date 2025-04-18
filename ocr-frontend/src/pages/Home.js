import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import placeholders from '../utils/placeholders';

function Home() {
    const navigate = useNavigate();
    const { darkMode, toggleDarkMode } = useContext(ThemeContext);
    const [activeQuestion, setActiveQuestion] = useState(null);

    const toggleQuestion = (index) => {
        setActiveQuestion(activeQuestion === index ? null : index);
    };

    const faqs = [
        {
            question: "What does your OCR technology support?",
            answer: "Our OCR technology supports multiple languages, handwritten text, printed documents, and can extract data from tables, forms, and various document formats."
        },
        {
            question: "How accurate is the text recognition?",
            answer: "Our OCR technology achieves over 98% accuracy on clearly printed documents and 90%+ accuracy on handwritten text, continuously improving through machine learning."
        },
        {
            question: "Can I integrate this with my existing systems?",
            answer: "Yes, we offer API access and SDK options for seamless integration with your existing applications, websites, or workflow systems."
        },
        {
            question: "How does document analysis work?",
            answer: "Our advanced AI analyzes document structure, identifies headers, paragraphs, tables, and extracts data into structured formats ready for further processing."
        },
        {
            question: "Are my documents secure?",
            answer: "We prioritize security with end-to-end encryption, automatic document deletion after processing, and compliance with global data protection regulations."
        }
    ];

    return (
        <div className="min-h-screen overflow-hidden">
            {/* Top right dark mode toggle */}
            <div className="absolute top-20 right-4 z-10">
                <button 
                    onClick={toggleDarkMode} 
                    className={`p-2 rounded-full transition-colors duration-300 hover:rotate-12 ${
                        darkMode 
                            ? 'bg-white/20 text-white' 
                            : 'bg-blue-100 text-blue-600'
                    }`}
                    aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    {darkMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Hero Section with Gradient Background */}
            <div className={`w-full ${darkMode ? 'bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900' : 'bg-gradient-to-b from-blue-50 via-blue-100 to-blue-200'}`}>
                <div className="container mx-auto px-4 py-20">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            The analytics platform to boost your 
                            <span className="text-blue-600 dark:text-blue-400 block md:inline"> OCR recognition</span>
                    </h1>
                        
                        <p className={`text-lg mb-8 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>
                            Discover the power of automation and data-driven suggestions for intelligent text recognition enhancement.
                        </p>
                        
                        <button 
                            onClick={() => navigate('/ocr')}
                            className="px-8 py-3 rounded-full text-white bg-blue-600 hover:bg-blue-700 font-medium transition duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                        >
                            Get Started →
                        </button>
                    </div>
                </div>
            </div>

            {/* Feature Cards Section */}
            <div className={`w-full py-16 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Feature Card 1 */}
                        <div className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/2 p-6">
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>AI Technology</div>
                                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Optimize the best time to post your content</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Our advanced AI analyzes historical performance data to determine the optimal posting times for maximum engagement and visibility.
                                    </p>
                                    <div className="mt-4">
                                        <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Learn more →</span>
                                    </div>
                                </div>
                                <div className="md:w-1/2 bg-blue-50 dark:bg-blue-900/20 p-4 flex items-center justify-center">
                                    <img 
                                        src={placeholders.postingSchedule}
                                        alt="Posting Schedule" 
                                        className="rounded-lg shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature Card 2 */}
                        <div className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/2 p-6">
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${darkMode ? 'bg-indigo-900/30 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>Customization</div>
                                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Maximize results with optimal hashtags</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Generate the perfect combination of hashtags based on trending topics and your content's performance metrics.
                                    </p>
                                    <div className="mt-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded-lg text-xs ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>15%</span>
                                            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average engagement increase</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-1/2 bg-indigo-50 dark:bg-indigo-900/20 p-4 flex items-center justify-center">
                                    <img 
                                        src={placeholders.hashtagAnalytics}
                                        alt="Hashtag Analytics" 
                                        className="rounded-lg shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature Card 3 */}
                        <div className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/2 p-6">
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>Content Creation</div>
                                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Create compelling content with AI</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Our AI-powered OCR not only extracts text but helps you transform it into engaging content optimized for your audience.
                                    </p>
                                    <div className="mt-4">
                                        <span className={`text-sm font-medium ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Try it now →</span>
                                    </div>
                                </div>
                                <div className="md:w-1/2 bg-cyan-50 dark:bg-cyan-900/20 p-4 flex items-center justify-center">
                                    <img 
                                        src={placeholders.aiContent}
                                        alt="AI Content Creator" 
                                        className="rounded-lg shadow-md"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Feature Card 4 */}
                        <div className={`rounded-xl overflow-hidden shadow-lg ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex flex-col md:flex-row">
                                <div className="md:w-1/2 p-6">
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${darkMode ? 'bg-teal-900/30 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>Analytics</div>
                                    <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Advanced document analytics</h3>
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Get detailed insights and analytics on your documents with powerful visualization tools.
                                    </p>
                                    <div className="mt-4">
                                        <div className="flex gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                            <span className="inline-block w-2 h-2 rounded-full bg-green-400"></span>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-1/2 bg-teal-50 dark:bg-teal-900/20 p-4 flex items-center justify-center">
                                    <img 
                                        src={placeholders.dataAnalytics}
                                        alt="Data Analytics" 
                                        className="rounded-lg shadow-md"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Analytics Dashboard Preview */}
            <div className={`w-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} py-10`}>
                <div className="container mx-auto px-4">
                    <div className="relative">
                        {/* Analytics Interface Mockup */}
                        <div className={`rounded-lg shadow-2xl overflow-hidden mx-auto max-w-5xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-between`}>
                                <div className="flex space-x-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    OCR Analytics Dashboard
                                </div>
                                <div className="w-16"></div>
                            </div>
                            
                            <div className="grid grid-cols-12 gap-4 p-4">
                                {/* Left Sidebar */}
                                <div className={`col-span-3 ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3`}>
                                    <div className="mb-4">
                                        <h3 className={`text-sm font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                            Last Edited
                                        </h3>
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((item) => (
                                                <div key={item} className={`flex items-center p-2 rounded-md ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'} cursor-pointer transition`}>
                                                    <div className={`w-10 h-10 rounded-md ${darkMode ? 'bg-blue-700' : 'bg-blue-100'} flex items-center justify-center mr-3`}>
                                                        <span className={`text-xs ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>DOC</span>
                                                    </div>
                                                    <div>
                                                        <p className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Document {item}</p>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>3m ago</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Main Content */}
                                <div className="col-span-9">
                                    <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Analytics</h2>
                                            <div className="flex space-x-2">
                                                <button className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700'}`}>
                                                    Daily
                                                </button>
                                                <button className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                    Weekly
                                                </button>
                                                <button className={`px-3 py-1 rounded-full text-xs ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                                    Monthly
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Stats Row */}
                                        <div className="grid grid-cols-3 gap-4 mb-6">
                                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Documents</p>
                                                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>72K</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-blue-900' : 'bg-blue-100'} flex items-center justify-center`}>
                                                        <span className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>🗎</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Accuracy</p>
                                                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>98.5%</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-yellow-900' : 'bg-yellow-100'} flex items-center justify-center`}>
                                                        <span className={`text-xs ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>✓</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>CTR</p>
                                                        <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>6.2%</p>
                                                    </div>
                                                    <div className={`w-8 h-8 rounded-full ${darkMode ? 'bg-green-900' : 'bg-green-100'} flex items-center justify-center`}>
                                                        <span className={`text-xs ${darkMode ? 'text-green-300' : 'text-green-700'}`}>↗</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Chart */}
                                        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-50'} h-60 relative`}>
                                            <div className="grid grid-cols-12 h-full gap-2 items-end">
                                                {[30, 45, 25, 60, 35, 50, 70, 55, 40, 65, 80, 75].map((height, i) => (
                                                    <div key={i} className="flex flex-col items-center justify-end h-full">
                                                        <div className={`w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm`} style={{height: `${height}%`}}></div>
                                                        <div className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {i + 1}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50/20 dark:to-gray-800/20"></div>
                                        </div>
                                    </div>
                    </div>
                    </div>
                    </div>
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className={`w-full py-20 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-3xl mx-auto mb-16">
                        <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            Simple, transparent pricing
                        </h2>
                        <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            Choose the perfect plan for your OCR needs
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Basic Plan */}
                        <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg transition-transform duration-300 hover:scale-105`}>
                            <div className="text-center mb-8">
                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Basic</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>$0</span>
                                    <span className={`ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>/month</span>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Perfect for getting started</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>100 pages/month</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Basic OCR features</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Standard support</span>
                                </li>
                            </ul>
                            <button className={`w-full py-3 px-4 rounded-lg border ${
                                darkMode 
                                    ? 'border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white' 
                                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                            } transition-colors duration-300`}>
                                Get Started Free
                            </button>
                        </div>

                        {/* Pro Plan */}
                        <div className={`rounded-2xl ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} p-8 shadow-lg relative transition-transform duration-300 hover:scale-105`}>
                            <div className="absolute top-0 right-8 transform -translate-y-1/2">
                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                    darkMode ? 'bg-blue-400 text-blue-900' : 'bg-blue-600 text-white'
                                }`}>
                                    Popular
                                </span>
                            </div>
                            <div className="text-center mb-8">
                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Pro</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>$29</span>
                                    <span className={`ml-2 ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>/month</span>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>Best for professionals</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-blue-100' : 'text-gray-600'}`}>1,000 pages/month</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-blue-100' : 'text-gray-600'}`}>Advanced OCR features</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-blue-100' : 'text-gray-600'}`}>Priority support</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-blue-100' : 'text-gray-600'}`}>API access</span>
                                </li>
                            </ul>
                            <button className={`w-full py-3 px-4 rounded-lg ${
                                darkMode 
                                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                            } transition-colors duration-300`}>
                                Start Pro Trial
                            </button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className={`rounded-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 shadow-lg transition-transform duration-300 hover:scale-105`}>
                            <div className="text-center mb-8">
                                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Enterprise</h3>
                                <div className="flex items-center justify-center mb-4">
                                    <span className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Custom</span>
                                </div>
                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>For large organizations</p>
                            </div>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Unlimited pages</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Custom AI models</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>24/7 dedicated support</span>
                                </li>
                                <li className="flex items-center">
                                    <svg className={`w-5 h-5 mr-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    <span className={`${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Custom integration</span>
                                </li>
                            </ul>
                            <button className={`w-full py-3 px-4 rounded-lg border ${
                                darkMode 
                                    ? 'border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white' 
                                    : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                            } transition-colors duration-300`}>
                                Contact Sales
                            </button>
                        </div>
                    </div>

                    {/* Additional Features */}
                    <div className="mt-16 max-w-4xl mx-auto">
                        <h3 className={`text-xl font-bold text-center mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            All plans include
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                }`}>
                                    <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                                    </svg>
                                </div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Secure Storage</h4>
                            </div>
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                }`}>
                                    <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                                    </svg>
                                </div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Fast Processing</h4>
                            </div>
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                }`}>
                                    <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                                    </svg>
                                </div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Multi-language</h4>
                            </div>
                            <div className="text-center">
                                <div className={`w-12 h-12 rounded-lg mx-auto mb-4 flex items-center justify-center ${
                                    darkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                }`}>
                                    <svg className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                                    </svg>
                                </div>
                                <h4 className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>99.9% Uptime</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div className={`w-full py-16 ${darkMode ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="container mx-auto px-4">
                    <h2 className={`text-3xl font-bold text-center mb-12 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Frequently Asked Questions
                    </h2>
                    
                    <div className="max-w-3xl mx-auto">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index} 
                                className={`mb-4 rounded-lg overflow-hidden transition-all duration-300 ${
                                    darkMode ? 'bg-gray-900' : 'bg-white'
                                } ${activeQuestion === index ? 'shadow-lg' : 'shadow'}`}
                            >
                <button 
                                    onClick={() => toggleQuestion(index)}
                                    className={`w-full text-left px-6 py-4 flex justify-between items-center ${
                                        darkMode ? 'text-white hover:bg-gray-800' : 'text-gray-800 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="font-medium">{faq.question}</span>
                                    <svg 
                                        className={`w-5 h-5 transition-transform duration-300 ${activeQuestion === index ? 'transform rotate-180' : ''}`} 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                </button>
                                
                                <div 
                                    className={`px-6 overflow-hidden transition-all duration-300 ${
                                        activeQuestion === index ? 'max-h-40 py-4' : 'max-h-0 py-0'
                                    }`}
                                >
                                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {faq.answer}
                                    </p>
                    </div>
                    </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Trusted Companies */}
            <div className={`w-full py-16 ${darkMode ? 'bg-blue-950' : 'bg-white'}`}>
                <div className="container mx-auto px-4">
                    <h3 className={`text-center text-lg font-medium mb-10 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Trusted by the best companies in the world
                    </h3>
                    
                    <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
                        <img 
                            src="https://cdn.worldvectorlogo.com/logos/microsoft-5.svg" 
                            alt="Microsoft" 
                            className={`h-8 md:h-10 ${darkMode ? 'brightness-200 opacity-70' : 'opacity-70'}`} 
                        />
                        <img 
                            src="https://cdn.worldvectorlogo.com/logos/google-2015.svg" 
                            alt="Google" 
                            className={`h-8 md:h-10 ${darkMode ? 'brightness-200 opacity-70' : 'opacity-70'}`} 
                        />
                        <img 
                            src="https://cdn.worldvectorlogo.com/logos/amazon-2.svg" 
                            alt="Amazon" 
                            className={`h-8 md:h-10 ${darkMode ? 'brightness-200 opacity-70' : 'opacity-70'}`} 
                        />
                        <img 
                            src="https://cdn.worldvectorlogo.com/logos/netflix-4.svg" 
                            alt="Netflix" 
                            className={`h-8 md:h-10 ${darkMode ? 'brightness-200 opacity-70' : 'opacity-70'}`} 
                        />
                        <img 
                            src="https://cdn.worldvectorlogo.com/logos/facebook-3.svg" 
                            alt="Facebook" 
                            className={`h-8 md:h-10 ${darkMode ? 'brightness-200 opacity-70' : 'opacity-70'}`} 
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home; 