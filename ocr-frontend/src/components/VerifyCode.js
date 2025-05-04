import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

function VerifyCode() {
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [success, setSuccess] = useState(false);
    const inputRefs = useRef([]);
    const hasRequestedCode = useRef(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { user, isAuthenticated, verifyUser } = useAuth();
    const email = location.state?.email || user?.email || '';
    
    // Redirect if already authenticated fully (and not just registered)
    useEffect(() => {
        if (isAuthenticated && !location.state?.justRegistered) {
            navigate('/ocr');
        }
    }, [isAuthenticated, navigate, location.state]);
    
    // Generate and send verification code on initial load only
    useEffect(() => {
        // Only send verification code if:
        // 1. We have a valid email
        // 2. We haven't sent a code yet (using ref to track across renders)
        // 3. Not currently in the sending state
        if (email && !hasRequestedCode.current && !isSending) {
            hasRequestedCode.current = true;
            sendVerificationCode(email);
        }
    }, [email, isSending]);
    
    // Send verification code request to backend
    const sendVerificationCode = async (email) => {
        try {
            setIsSending(true);
            await axios.post('/api/auth/verify/generate-code', { email });
            setIsSending(false);
            
            // If successful, set cooldown
            setResendCooldown(60);
            
            return true;
        } catch (error) {
            setIsSending(false);
            
            // Handle rate limiting case
            if (error.response && error.response.status === 429) {
                const retryAfter = error.response.data.retryAfter || 60;
                setResendCooldown(retryAfter);
                return false;
            }
            
            // Handle other errors
            setError(error.response?.data?.message || 'Error sending verification code');
            return false;
        }
    };
    
    // Handle resend cooldown timer
    useEffect(() => {
        let interval = null;
        if (resendCooldown > 0) {
            interval = setInterval(() => {
                setResendCooldown(resendCooldown - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [resendCooldown]);
    
    // Handle input changes
    const handleChange = (index, value) => {
        if (value.length > 1) {
            // If pasting multiple characters, distribute them across fields
            const chars = value.split('');
            const newCode = [...code];
            for (let i = 0; i < chars.length && i + index < 6; i++) {
                if (/^\d$/.test(chars[i])) {
                    newCode[i + index] = chars[i];
                    // Auto-focus next input after filling this one
                    if (i + index + 1 < 6) {
                        inputRefs.current[i + index + 1].focus();
                    }
                }
            }
            setCode(newCode);
        } else {
            // Single character input
            if (!/^\d$/.test(value) && value !== '') {
                return; // Only allow digits
            }
            
            const newCode = [...code];
            newCode[index] = value;
            setCode(newCode);
            
            // Auto-focus next input after filling this one
            if (value !== '' && index < 5) {
                inputRefs.current[index + 1].focus();
            }
        }
    };
    
    // Handle key press events
    const handleKeyDown = (index, e) => {
        // If backspace and current field is empty, focus previous field
        if (e.key === 'Backspace' && code[index] === '' && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };
    
    // Handle code verification
    const verifyCode = async () => {
        const enteredCode = code.join('');
        
        if (enteredCode.length !== 6) {
            setError('Please enter the complete 6-digit verification code');
            return;
        }
        
        setIsVerifying(true);
        setError('');
        
        try {
            // Verify the code against our backend
            await axios.post('/api/auth/verify/verify-code', {
                email,
                code: enteredCode
            });
            
            // Mark the user as verified
            verifyUser();
            setSuccess(true);
            
            // Navigate to the OCR page after a slight delay
            setTimeout(() => {
                navigate('/ocr');
            }, 1500);
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Verification failed. Please try again.';
            setError(errorMessage);
            console.error('Verification error:', err);
        } finally {
            setIsVerifying(false);
        }
    };
    
    // Handle resend code
    const handleResendCode = async () => {
        // Check if cooldown is still active
        if (resendCooldown > 0 || isSending) return;
        
        // Clear previous error
        setError('');
        
        // Reset the flag to allow sending again
        hasRequestedCode.current = false;
        
        // Send new verification code
        await sendVerificationCode(email);
    };
    
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-darkBg py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        Verify Your Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        We've sent a verification code to<br />
                        <span className="font-medium text-gray-900 dark:text-white">{email}</span>
                    </p>
                </div>
                
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md mt-4">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}
                
                <div className="mt-8">
                    <div className="flex flex-col items-center">
                        <div className="flex justify-between w-full max-w-xs gap-2">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={el => inputRefs.current[index] = el}
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    className="w-12 h-14 text-center text-xl font-semibold border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onFocus={e => e.target.select()}
                                />
                            ))}
                        </div>
                        
                        <button
                            onClick={verifyCode}
                            disabled={isVerifying || success}
                            className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isVerifying ? (
                                <span className="flex items-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Verifying...
                                </span>
                            ) : success ? (
                                <span className="flex items-center">
                                    <svg className="-ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Verified
                                </span>
                            ) : (
                                "Verify"
                            )}
                        </button>
                    </div>
                </div>
                
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Didn't receive the code?{' '}
                        {resendCooldown > 0 ? (
                            <span className="text-gray-400 dark:text-gray-500">
                                Resend in {resendCooldown}s
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isSending}
                                className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSending ? 'Sending...' : 'Resend code'}
                            </button>
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default VerifyCode; 