import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const Blog = () => {
    const { darkMode } = useContext(ThemeContext);

    // Sample blog data - in a real app, this would come from an API
    const featuredBlogs = [
        {
            id: 1,
            title: "OCR Technology: The Revolution in Document Digitization",
            author: "Michael Johnson",
            date: "June 15, 2023",
            excerpt: "Explore how modern OCR technology is transforming the way businesses handle document processing and data extraction.",
            readTime: "7 min read",
            image: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?q=80&w=2070"
        },
        {
            id: 2,
            title: "The Pre-production Stage of Document Digitization",
            author: "Dave Smith",
            date: "July 05, 2023",
            excerpt: "Understanding the crucial steps before beginning a large-scale document digitization project.",
            readTime: "5 min read",
            image: "https://images.unsplash.com/photo-1581089778245-3ce67677f718?q=80&w=2070"
        },
        {
            id: 3,
            title: "Best Practices for Document Scanning",
            author: "Michael Jackson",
            date: "August 22, 2023",
            excerpt: "Learn the professional techniques to ensure high-quality document scans for optimal OCR results.",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1588485256313-f021c74731f1?q=80&w=1974"
        },
        {
            id: 4,
            title: "Document Digitization: A Team Effort",
            author: "Rosalind Anderson",
            date: "September 18, 2023",
            excerpt: "How professionals from different fields collaborate to create successful digitization projects.",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070"
        },
        {
            id: 5,
            title: "The Science of OCR Accuracy",
            author: "Michael Clarke",
            date: "October 30, 2023",
            excerpt: "Dive deep into the technical aspects that affect OCR accuracy and how to improve your results.",
            readTime: "9 min read",
            image: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1965"
        }
    ];

    const recentBlogs = featuredBlogs.slice(0, 3);
    
    const popularTopics = [
        {
            id: 1,
            title: "Document Data Extraction: Key Technologies and Methods",
            excerpt: "Discovering the best approaches for extracting structured data from unstructured documents.",
            image: "https://images.unsplash.com/photo-1679403766669-4ab216a75d3e?q=80&w=2070",
        },
        {
            id: 2,
            title: "AI-Powered OCR: The Future of Document Processing",
            excerpt: "How artificial intelligence is enhancing OCR capabilities and accuracy.",
            image: "https://images.unsplash.com/photo-1639762681057-408e52192e55?q=80&w=2232",
        },
        {
            id: 3,
            title: "Document Security in the Digital Age",
            excerpt: "Ensuring your digitized documents remain secure and compliant with regulations.",
            image: "https://images.unsplash.com/photo-1614064641938-3bbee52942c7?q=80&w=2070",
        }
    ];

    return (
        <div className={`pt-24 pb-16 ${darkMode ? 'bg-darkBg text-white' : 'bg-gray-50 text-gray-800'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <div className={`p-8 mb-12 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <h1 className={`text-3xl font-bold mb-4 ${darkMode ? 'text-accent' : 'text-primary'}`}>Our Blogs</h1>
                    <p className={`text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        Document digitization is the process of converting physical documents into digital format. This process involves several stages,
                        including preparation, scanning, OCR processing, verification, and delivery.
                    </p>
                </div>

                {/* Featured Posts */}
                <div className="mb-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Featured Posts</h2>
                        <Link to="/blog/all" className={`text-sm font-medium ${darkMode ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary-dark'}`}>
                            View All
                        </Link>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {featuredBlogs.slice(0, 3).map(blog => (
                            <div key={blog.id} className={`rounded-lg shadow-md overflow-hidden transition-transform duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="h-48 overflow-hidden">
                                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        By {blog.author} • {blog.date}
                                    </p>
                                    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{blog.title}</h3>
                                    <p className={`mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{blog.excerpt}</p>
                                    <div className="flex justify-between items-center">
                                        <Link 
                                            to={`/blog/${blog.id}`} 
                                            className={`text-sm font-medium ${darkMode ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary-dark'}`}
                                        >
                                            Read Post →
                                        </Link>
                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{blog.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Posts */}
                <div className="mb-16">
                    <h2 className={`text-2xl font-semibold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Recents</h2>
                    <div className="space-y-8">
                        {recentBlogs.map(blog => (
                            <div key={blog.id} className={`flex flex-col md:flex-row gap-6 p-6 rounded-lg shadow-md ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="md:w-1/4 h-48 md:h-auto overflow-hidden rounded-lg">
                                    <img src={blog.image} alt={blog.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="md:w-3/4">
                                    <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        By {blog.author} • {blog.date}
                                    </p>
                                    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{blog.title}</h3>
                                    <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{blog.excerpt}</p>
                                    <div className="flex justify-between items-center">
                                        <Link 
                                            to={`/blog/${blog.id}`} 
                                            className={`text-sm font-medium ${darkMode ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary-dark'}`}
                                        >
                                            Read Post →
                                        </Link>
                                        <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{blog.readTime}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Topics */}
                <div>
                    <h2 className={`text-2xl font-semibold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Popular</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {popularTopics.map(topic => (
                            <div key={topic.id} className={`rounded-lg shadow-md overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                                <div className="h-48 overflow-hidden">
                                    <img src={topic.image} alt={topic.title} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <h3 className={`text-xl font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{topic.title}</h3>
                                    <p className={`mb-4 line-clamp-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{topic.excerpt}</p>
                                    <Link 
                                        to={`/blog/topic/${topic.id}`} 
                                        className={`text-sm font-medium ${darkMode ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary-dark'}`}
                                    >
                                        Read Post →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Blog; 