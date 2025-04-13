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
    const { login } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const toggleAuth = () => {
        setIsLoginActive(!isLoginActive);
    };

    // Function to initialize Google Sign-In
    const initializeGoogleSignIn = () => {
        if (window.google && googleButtonRef.current) {
            try {
                window.google.accounts.id.initialize({
                    client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID || '682799088248-33ao10nip4lhf9d0ja113nnofse0o1ke.apps.googleusercontent.com',
                    callback: handleGoogleSignIn,
                    // Add this to allow testing in Docker/localhost
                    allowed_parent_origin: window.location.origin
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
                        width: '100%'
                    }
                );
            } catch (error) {
                console.error('Error initializing Google Sign-In:', error);
            }
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
            console.log("Google sign-in response:", response);
            const data = await authApi.loginWithGoogle(response.credential);
            
            if (data.token) {
                login(data.token);
            } else {
                console.error('Google login failed: No token in response');
            }
        } catch (error) {
            console.error('Google login error:', error);
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
                        {/* <button className="social-button">
                            <span className="icon github-icon"></span>
                            GitHub
                        </button> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Auth;