import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';

const BlogPost = () => {
    const { id } = useParams();
    const { darkMode } = useContext(ThemeContext);
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Sample blog data - in a real app, this would come from an API
    const blogPosts = useMemo(() => [
        {
            id: 1,
            title: "OCR Technology: The Revolution in Document Digitization",
            author: "Michael Johnson",
            date: "June 15, 2023",
            readTime: "7 min read",
            image: "https://images.unsplash.com/photo-1633412802994-5c058f151b66?q=80&w=2070",
            content: `
                <p>Optical Character Recognition (OCR) technology has revolutionized the way businesses handle document processing. Gone are the days of manual data entry from paper documents - modern OCR solutions can now automatically extract text from scanned documents, images, and even handwritten notes with remarkable accuracy.</p>
                
                <h2>What is OCR?</h2>
                <p>OCR technology works by analyzing the patterns of light and dark that make up letters and numbers in an image. It then converts these shapes into machine-readable text that can be edited, searched, and stored efficiently. Modern OCR systems use advanced algorithms, machine learning, and artificial intelligence to improve accuracy and handle complex document formats.</p>
                
                <h2>Benefits of OCR Technology</h2>
                <ul>
                    <li><strong>Increased Efficiency:</strong> Automate data extraction from documents and eliminate manual typing.</li>
                    <li><strong>Reduced Errors:</strong> Minimize human error in data entry and transcription.</li>
                    <li><strong>Cost Savings:</strong> Reduce labor costs associated with manual document processing.</li>
                    <li><strong>Improved Searchability:</strong> Make text within documents searchable and indexable.</li>
                    <li><strong>Enhanced Security:</strong> Digitize sensitive documents for secure storage and controlled access.</li>
                </ul>
                
                <h2>Applications of OCR</h2>
                <p>The applications of OCR technology span across numerous industries:</p>
                <ul>
                    <li><strong>Healthcare:</strong> Process patient forms, medical records, and prescriptions.</li>
                    <li><strong>Finance:</strong> Extract data from invoices, receipts, and financial statements.</li>
                    <li><strong>Legal:</strong> Digitize case files, contracts, and legal documents.</li>
                    <li><strong>Education:</strong> Convert printed educational materials into digital format.</li>
                    <li><strong>Government:</strong> Process forms, applications, and identification documents.</li>
                </ul>
                
                <h2>The Future of OCR</h2>
                <p>As OCR technology continues to evolve, we can expect even greater accuracy and versatility. The integration of deep learning algorithms is already improving the ability to recognize handwriting and complex layouts. The next generation of OCR solutions will likely offer real-time processing through mobile devices, enabling instant digitization of documents on the go.</p>
                
                <p>Businesses that embrace OCR technology today will be well-positioned to improve their document workflows, reduce costs, and enhance data accessibility in an increasingly digital world.</p>
            `
        },
        {
            id: 2,
            title: "The Pre-production Stage of Document Digitization",
            author: "Dave Smith",
            date: "July 05, 2023",
            readTime: "5 min read",
            image: "https://images.unsplash.com/photo-1581089778245-3ce67677f718?q=80&w=2070",
            content: `
                <p>The success of any document digitization project largely depends on proper planning and preparation. The pre-production stage is a critical phase that sets the foundation for the entire process, ensuring efficient execution and high-quality results.</p>
                
                <h2>Key Components of Pre-production Planning</h2>
                
                <h3>1. Document Assessment and Inventory</h3>
                <p>Before beginning any digitization project, it's essential to conduct a thorough assessment of the documents to be processed. This includes:</p>
                <ul>
                    <li>Document types and formats (standard forms, books, newspapers, photographs)</li>
                    <li>Physical condition (fragile, damaged, stapled, bound)</li>
                    <li>Size variations and special handling requirements</li>
                    <li>Document volume and complexity</li>
                    <li>Confidentiality and security requirements</li>
                </ul>
                
                <h3>2. Defining Objectives and Scope</h3>
                <p>Clearly outline what you hope to achieve with your digitization project:</p>
                <ul>
                    <li>Primary purpose (archiving, searchability, workflow improvement)</li>
                    <li>Required output formats (PDF, searchable PDF, XML, etc.)</li>
                    <li>Metadata requirements and indexing criteria</li>
                    <li>Quality expectations and accuracy requirements</li>
                    <li>Timeline and budget constraints</li>
                </ul>
                
                <h3>3. Equipment and Technology Selection</h3>
                <p>Choose the appropriate hardware and software based on your document types and project requirements:</p>
                <ul>
                    <li>Scanner types (flatbed, sheet-fed, overhead, specialized)</li>
                    <li>OCR software selection</li>
                    <li>Image processing tools</li>
                    <li>Quality control systems</li>
                    <li>Document management and storage solutions</li>
                </ul>
                
                <h3>4. Workflow Design</h3>
                <p>Establish a clear, step-by-step process for handling documents from receipt to final delivery:</p>
                <ul>
                    <li>Document preparation procedures (removal of staples, smoothing creases)</li>
                    <li>Scanning protocols and settings</li>
                    <li>OCR processing guidelines</li>
                    <li>Quality assurance checkpoints</li>
                    <li>Exception handling procedures</li>
                    <li>Document return or disposal process</li>
                </ul>
                
                <h2>Benefits of Thorough Pre-production Planning</h2>
                <p>Investing time in the pre-production phase yields significant benefits:</p>
                <ul>
                    <li>Reduced processing errors and quality issues</li>
                    <li>More accurate project timelines and cost estimates</li>
                    <li>Optimized resource allocation</li>
                    <li>Improved handling of exceptions and special cases</li>
                    <li>Higher quality end results</li>
                </ul>
                
                <p>By giving proper attention to the pre-production stage, organizations can ensure their document digitization projects proceed smoothly and deliver the expected results within budget and timeline constraints.</p>
            `
        },
        {
            id: 3,
            title: "Best Practices for Document Scanning",
            author: "Michael Jackson",
            date: "August 22, 2023",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1588485256313-f021c74731f1?q=80&w=1974",
            content: `
                <p>Document scanning is a critical step in the digitization process that directly impacts OCR accuracy and the overall quality of your digital archives. By following these best practices, you can ensure optimal results from your document scanning efforts.</p>
                
                <h2>Scanner Selection and Setup</h2>
                <p>Choose the right equipment for your specific needs:</p>
                <ul>
                    <li><strong>Resolution Settings:</strong> Scan at 300 DPI minimum for OCR processing. Higher resolutions (up to 600 DPI) may be necessary for documents with small text or detailed images.</li>
                    <li><strong>Color vs. Grayscale vs. Black & White:</strong> Use color scanning for documents with color-coded information or colored backgrounds. Grayscale is suitable for most text documents, while black and white (bitonal) scanning works best for high-contrast text documents.</li>
                    <li><strong>Scanner Maintenance:</strong> Regularly clean scanning surfaces and feed mechanisms to prevent dust and debris from affecting scan quality.</li>
                </ul>
                
                <h2>Document Preparation</h2>
                <p>Proper preparation improves scanning efficiency and quality:</p>
                <ul>
                    <li><strong>Remove Fasteners:</strong> Take out staples, paper clips, and other binding materials that could damage scanners or cause paper jams.</li>
                    <li><strong>Repair Damaged Pages:</strong> Mend tears and unfold corners to ensure smooth feeding through automatic document feeders.</li>
                    <li><strong>Sort by Size and Type:</strong> Group similar documents together to minimize scanner adjustments between batches.</li>
                    <li><strong>Remove Sticky Notes:</strong> Either integrate them into the document permanently or document their content separately.</li>
                </ul>
                
                <h2>Scanning Process</h2>
                <p>Follow these steps for consistent, high-quality scans:</p>
                <ul>
                    <li><strong>Test Scans:</strong> Perform sample scans on representative documents to verify settings before processing large volumes.</li>
                    <li><strong>Orientation Control:</strong> Ensure documents are straight and properly aligned to avoid skewed images.</li>
                    <li><strong>Batch Size Management:</strong> Process manageable batch sizes to facilitate quality control and error correction.</li>
                    <li><strong>Automated Enhancements:</strong> Use scanner software features like deskewing, despeckling, and blank page removal when appropriate.</li>
                    <li><strong>File Naming Convention:</strong> Establish a consistent naming system that facilitates easy identification and retrieval.</li>
                </ul>
                
                <h2>Quality Control Measures</h2>
                <p>Implement robust quality checks throughout the scanning process:</p>
                <ul>
                    <li><strong>Visual Inspection:</strong> Regularly check scanned images for quality issues like skewing, cropping errors, or blurriness.</li>
                    <li><strong>Completeness Verification:</strong> Confirm all pages have been scanned and are in the correct order.</li>
                    <li><strong>OCR Testing:</strong> Sample the OCR results to ensure the scanned images produce accurate text recognition.</li>
                    <li><strong>Rescanning Protocol:</strong> Establish clear criteria for when documents need to be rescanned.</li>
                </ul>
                
                <h2>Advanced Techniques</h2>
                <p>Consider these advanced approaches for complex scanning projects:</p>
                <ul>
                    <li><strong>Image Enhancement:</strong> Use advanced image processing to improve contrast, remove backgrounds, or enhance faded text.</li>
                    <li><strong>Specialized Document Handling:</strong> Develop specific protocols for unusual materials like bound books, large-format documents, or delicate historical materials.</li>
                    <li><strong>Hybrid Approach:</strong> Combine automated scanning with manual processes for materials that require special handling.</li>
                </ul>
                
                <p>By implementing these scanning best practices, organizations can significantly improve the quality of their digitized documents, enhance OCR accuracy, and ensure their digital archives are accessible, searchable, and preservable for the long term.</p>
            `
        }
    ], []);
    
    useEffect(() => {
        // Simulate API call to fetch blog post data
        setLoading(true);
        
        // Find the blog post with the matching ID
        const foundPost = blogPosts.find(post => post.id === parseInt(id));
        
        if (foundPost) {
            setPost(foundPost);
            setLoading(false);
        } else {
            // Redirect to 404 if post not found
            navigate('/not-found', { replace: true });
        }
    }, [id, navigate, blogPosts]);
    
    if (loading) {
        return (
            <div className={`pt-24 pb-16 min-h-screen ${darkMode ? 'bg-darkBg text-white' : 'bg-gray-50 text-gray-800'}`}>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center items-center">
                    <div className="animate-pulse flex flex-col w-full">
                        <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-6"></div>
                        <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-10"></div>
                        <div className="h-96 bg-gray-300 dark:bg-gray-700 rounded mb-8"></div>
                        <div className="space-y-4">
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className={`pt-24 pb-16 ${darkMode ? 'bg-darkBg text-white' : 'bg-gray-50 text-gray-800'}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Button */}
                <Link 
                    to="/blog" 
                    className={`inline-flex items-center mb-8 text-sm font-medium ${darkMode ? 'text-accent hover:text-accent/80' : 'text-primary hover:text-primary-dark'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Back to Blog
                </Link>
                
                {/* Blog Post Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl md:text-4xl font-bold mb-4 ${darkMode ? 'text-accent' : 'text-primary'}`}>{post.title}</h1>
                    <div className={`flex items-center text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <span>By {post.author}</span>
                        <span className="mx-2">•</span>
                        <span>{post.date}</span>
                        <span className="mx-2">•</span>
                        <span>{post.readTime}</span>
                    </div>
                </div>
                
                {/* Featured Image */}
                <div className="rounded-lg overflow-hidden mb-10 h-96">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
                </div>
                
                {/* Blog Content */}
                <div 
                    className={`prose ${darkMode ? 'prose-invert' : ''} max-w-none prose-headings:font-semibold prose-headings:text-primary dark:prose-headings:text-accent prose-a:text-primary dark:prose-a:text-accent prose-img:rounded-lg`}
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
                
                {/* Related Posts Section */}
                <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h2 className={`text-2xl font-semibold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Related Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {blogPosts
                            .filter(relatedPost => relatedPost.id !== post.id)
                            .slice(0, 3)
                            .map(relatedPost => (
                                <Link 
                                    key={relatedPost.id} 
                                    to={`/blog/${relatedPost.id}`}
                                    className={`group block rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
                                >
                                    <div className="h-40 overflow-hidden">
                                        <img src={relatedPost.image} alt={relatedPost.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                    </div>
                                    <div className="p-4">
                                        <h3 className={`text-md font-semibold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{relatedPost.title}</h3>
                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{relatedPost.readTime}</p>
                                    </div>
                                </Link>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlogPost; 