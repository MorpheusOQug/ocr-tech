import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import OCRPage from "./pages/OCRPage";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ValidationProvider } from "./context/ValidationContext";
import Login from "./components/Login";
import Register from "./components/Register";
import NotFound from "./pages/NotFound";

// Future flags for React Router v7
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

// Placeholder components for Blog and Solutions pages
const Blog = () => (
    <div className="container pt-8">
        <h1 className="text-3xl font-bold mb-4">Blog</h1>
        <p className="text-gray-700 dark:text-gray-300">Blog content coming soon...</p>
    </div>
);

const Solutions = () => (
    <div className="container pt-8">
        <h1 className="text-3xl font-bold mb-4">Solutions</h1>
        <p className="text-gray-700 dark:text-gray-300">Solutions content coming soon...</p>
    </div>
);

// Loading component for authentication check
const LoadingScreen = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkBg">
        <div className="text-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
    </div>
);

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Show loading screen while checking authentication
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ValidationProvider>
                    <Router future={routerFutureConfig}>
                        <Navbar />
                        <div className="pt-16 min-h-screen bg-gray-50 dark:bg-darkBg">
                            <Routes>
                                <Route path="/" element={<Home />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route 
                                    path="/ocr" 
                                    element={
                                        <ProtectedRoute>
                                            <OCRPage />
                                        </ProtectedRoute>
                                    } 
                                />
                                <Route path="/blog" element={<Blog />} />
                                <Route path="/solutions" element={<Solutions />} />
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </div>
                    </Router>
                </ValidationProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
