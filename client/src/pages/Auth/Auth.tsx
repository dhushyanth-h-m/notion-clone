import React, { useState, useEffect, useRef } from 'react';
import Login from '../../components/Login/Login';
import Signup from '../../components/Signup/Signup';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api';
import './Auth.css';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
        }
      }
    }
  }
}

const Auth: React.FC = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);
    const { login, isAuthenticated, serverError } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);

    // Log authentication state for debugging
    useEffect(() => {
        console.log("Auth component - isAuthenticated:", isAuthenticated);
    }, [isAuthenticated]);

    const toggleAuth = () => {
        setIsLoginActive(!isLoginActive);
    };

    // Function to initialize Google Sign-In
    const initializeGoogleSignIn = () => {
        if (window.google && googleButtonRef.current) {
            try {
                console.log("Initializing Google Sign-In...");
                // Get hostname for correct origin validation
                const origin = window.location.origin;
                console.log("Current origin:", origin);
                
                window.google.accounts.id.initialize({
                    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '682799088248-33ao10nip4lhf9d0ja113nnofse0o1ke.apps.googleusercontent.com',
                    callback: handleGoogleSignIn,
                    auto_select: false,
                    cancel_on_tap_outside: true,
                    // These settings help with local development
                    ux_mode: 'popup'
                });
                
                window.google.accounts.id.renderButton(
                    googleButtonRef.current,
                    { 
                        type: 'standard',
                        theme: 'outline', 
                        size: 'large',
                        text: 'continue_with',
                        shape: 'rectangular',
                        logo_alignment: 'left',
                        width: 250 // Fixed width instead of percentage
                    }
                );
                console.log("Google Sign-In button rendered");
            } catch (error) {
                console.error('Error initializing Google Sign-In:', error);
                setGoogleAuthError('Failed to initialize Google Sign-In');
            }
        } else {
            console.log("Google API not available yet or button ref not ready");
        }
    };

    useEffect(() => {
        // Check if the Google API is already loaded
        if (window.google) {
            initializeGoogleSignIn();
        } else {
            // If not loaded yet, set up a listener for when it loads
            const googleScriptObserver = new MutationObserver((mutations, observer) => {
                if (window.google) {
                    initializeGoogleSignIn();
                    observer.disconnect();
                }
            });
            
            // Start observing
            googleScriptObserver.observe(document, {
                childList: true,
                subtree: true
            });
            
            // Clean up observer
            return () => {
                googleScriptObserver.disconnect();
            };
        }
    }, []);

    const handleGoogleSignIn = async (response: any) => {
        try {
            console.log("Google sign-in response received:", response);
            setGoogleAuthError(null);
            
            if (!response.credential) {
                console.error("No credential in Google response");
                setGoogleAuthError('Google authentication failed: No credential received');
                return;
            }
            
            // If the server is already known to be down, don't make the API call
            if (serverError) {
                setGoogleAuthError('Server connection error. Please try again later.');
                return;
            }
            
            console.log("Sending Google token to backend...");
            try {
                const data = await authApi.loginWithGoogle(response.credential);
                
                console.log("Backend response:", data);
                
                if (data.token) {
                    console.log("Token received, calling login()");
                    login(data.token);
                    console.log("Login function called");
                } else {
                    console.error('Google login failed: No token in response');
                    setGoogleAuthError('Google login failed: No token in response');
                }
            } catch (error) {
                console.error('Google login error:', error);
                // Log more details about the error
                if (error.response) {
                    console.error('Error response:', error.response.data);
                    console.error('Error status:', error.response.status);
                    setGoogleAuthError(`Server error: ${error.response.status} ${error.response.data?.message || ''}`);
                } else if (error.code === 'ERR_NETWORK') {
                    setGoogleAuthError('Cannot connect to server. Please try again later.');
                } else {
                    setGoogleAuthError('An error occurred during Google login');
                }
            }
        } catch (error) {
            console.error('Google sign-in handler error:', error);
            setGoogleAuthError('An unexpected error occurred');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Welcome</h1>
                    <p>Sign in to your account or create a new one</p>
                </div>
                
                <div className="auth-tabs">
                    <button 
                        className={`auth-tab ${isLoginActive ? 'active' : ''}`}    
                        onClick={() => setIsLoginActive(true)}    
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${!isLoginActive ? 'active' : ''}`}
                        onClick={() => setIsLoginActive(false)}
                    >
                        Sign Up
                    </button>
                </div>
                <div className="auth-content">
                    {isLoginActive ? <Login /> : <Signup />}
                </div>
                
                <div className="social-login-section">
                    <div className="social-login-text">OR CONTINUE WITH</div>
                    <div className="social-buttons">
                        <div ref={googleButtonRef} className="google-button-container"></div>
                        {googleAuthError && (
                            <div className="google-auth-error">
                                {googleAuthError}
                            </div>
                        )}
                        {serverError && (
                            <div className="server-connection-error">
                                Server connection error. Email/password login may still work.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;