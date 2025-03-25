import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const { darkMode } = useContext(ThemeContext);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            // Here you would typically make an API call to your backend
            // For demo purposes, we'll just simulate a successful registration
            const userData = {
                name: formData.name,
                email: formData.email,
                id: '1'
            };
            
            login(userData);
            navigate('/ocr');
        } catch (err) {
            setError('Registration failed. Please try again.');
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
                        Create your account
                    </h2>
                    <p className={`mt-2 text-center text-sm ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                        Join us to start your OCR journey
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="name" className="sr-only">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
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
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                className={`appearance-none rounded-none relative block w-full px-3 py-2 border ${
                                    darkMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                                } placeholder-gray-500 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm`}
                                placeholder="Confirm Password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
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
                            Create Account
                        </button>
                    </div>

                    <div className="text-sm text-center">
                        <Link
                            to="/login"
                            className={`font-medium ${
                                darkMode ? 'text-primary-light hover:text-primary' : 'text-primary hover:text-primary-dark'
                            }`}
                        >
                            Already have an account? Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register; 