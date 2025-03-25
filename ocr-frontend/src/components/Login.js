import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { darkMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // Here you would typically make an API call to your backend
            // For demo purposes, we'll just simulate a successful login
            const userData = {
                name: 'Demo User',
                email: email,
                id: '1'
            };
            
            login(userData);
            navigate('/ocr');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className={`max-w-md w-full space-y-8 p-8 rounded-lg shadow-lg ${
                darkMode ? 'bg-gray-800' : 'bg-white'
            }`}>
                <div>
                    <h2 className={`mt-6 text-center text-3xl font-extrabold ${
                        darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        Sign in to your account
                    </h2>
                    <p className={`mt-2 text-center text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        Welcome back! Please enter your details
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                        >
                            Sign in
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link
                            to="/register"
                            className={`font-medium ${
                                darkMode ? 'text-primary-light hover:text-primary' : 'text-primary hover:text-primary-dark'
                            }`}
                        >
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login; 