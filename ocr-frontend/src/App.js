import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import OCRPage from "./pages/OCRPage";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Navbar from "./components/Navbar";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AdminProvider } from "./context/AdminContext";
import { ValidationProvider } from "./context/ValidationContext";
import Login from "./components/Login";
import Register from "./components/Register";
import VerifyCode from "./components/VerifyCode";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/admin/AdminDashboard";
import NotFound from "./pages/NotFound";

// Future flags for React Router v7
const routerFutureConfig = {
  v7_startTransition: true,
  v7_relativeSplatPath: true
};

// Placeholder component for Solutions page
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
    const { isAuthenticated, isVerified, isLoading } = useAuth();
    
    // Show loading screen while checking authentication
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    // Redirect to verification page if authenticated but not verified
    if (!isVerified) {
        return <Navigate to="/verify-code" replace state={{ justRegistered: true }} />;
    }
    
    return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Show loading screen while checking authentication
    if (isLoading) {
        return <LoadingScreen />;
    }
    
    // Redirect to admin login if not authenticated
    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace />;
    }
    
    // Check if the user is the hardcoded admin (only admin@admin.com can access)
    if (localStorage.getItem('userEmail') !== 'admin@admin.com') {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

function App() {
    return (
        <AuthProvider>
            <AdminProvider>
                <ThemeProvider>
                    <ValidationProvider>
                        <Router future={routerFutureConfig}>
                            <div className="flex flex-col min-h-screen overflow-x-hidden">
                            <Navbar />
                                <main className="flex-grow bg-gray-50 dark:bg-darkBg pt-16 mx-auto w-full max-w-full">
                                <Routes>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />
                                    <Route path="/verify-code" element={<VerifyCode />} />
                                    <Route 
                                        path="/ocr" 
                                        element={
                                            <ProtectedRoute>
                                                <OCRPage />
                                            </ProtectedRoute>
                                        } 
                                    />
                                    <Route path="/blog" element={<Blog />} />
                                    <Route path="/blog/:id" element={<BlogPost />} />
                                    <Route path="/solutions" element={<Solutions />} />
                                    
                                    {/* Admin Routes */}
                                    <Route path="/admin/login" element={<AdminLogin />} />
                                    <Route 
                                        path="/admin/dashboard" 
                                        element={
                                            <AdminRoute>
                                                <AdminDashboard />
                                            </AdminRoute>
                                        } 
                                    />
                                    
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                                </main>
                            </div>
                        </Router>
                    </ValidationProvider>
                </ThemeProvider>
            </AdminProvider>
        </AuthProvider>
    );
}

export default App;
