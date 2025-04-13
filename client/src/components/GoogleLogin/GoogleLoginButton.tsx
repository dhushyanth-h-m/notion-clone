import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import './GoogleLoginButton.css';

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

const GoogleLoginButton: React.FC = () => {
    const { login } = useAuth();

    useEffect(() => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: '682799088248-33ao10nip4lhf9d0ja113nnofse0o1ke.apps.googleusercontent.com',
                callback: handleCredentialResponse
            });
            
            window.google.accounts.id.renderButton(
                document.getElementById('google-signin-button') as HTMLElement,
                { theme: 'outline', size: 'large', width: 300 }
            );
        }
    }, []);

    const handleCredentialResponse = async (response: any) => {
        console.log("Google Sign-In Response:", response);
        try {
            // Decode the JWT for debugging
            const payload = JSON.parse(atob(response.credential.split('.')[1]));
            console.log("Decoded credential payload:", payload);
            
            console.log("Attempting to fetch from server:", 'http://localhost:5001/auth/google');
            
            const serverResponse = await fetch('http://localhost:5001/auth/google', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: response.credential }),
            });
            
            console.log("Server response status:", serverResponse.status);
            
            if (!serverResponse.ok) {
                const errorText = await serverResponse.text();
                console.error(`Server error (${serverResponse.status}):`, errorText);
                throw new Error(`Server returned ${serverResponse.status}: ${errorText}`);
            }
            
            const data = await serverResponse.json();
            console.log("Server response data:", data);
            
            if (data.token) {
                login(data.token);
                // The auth context will handle redirection
            } else {
                console.error('Google login failed: No token in response');
            }
        } catch (error) {
            console.error('Google login error:', error);
        }
    };

    return (
        <div id="google-signin-button" className="google-signin-container"></div>
    );
}

export default GoogleLoginButton;