import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import OCRPage from "./pages/OCRPage";
import Navbar from "./components/Navbar";
import TailwindTest from "./components/TailwindTest";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./components/Login";
import Register from "./components/Register";

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

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router future={routerFutureConfig}>
                    <Navbar />
                    <TailwindTest />
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
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </div>
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
