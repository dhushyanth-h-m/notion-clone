import React, { useState } from 'react';
import Login from '../../components/Login/Login';
import Signup from '../../components/Signup/Signup';

const Auth: React.FC = () => {
    const [isLoginActive, setIsLoginActive] = useState(true);

    const toggleAuth = () => {
        setIsLoginActive(!isLoginActive);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
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
            </div>
        </div>
    );
};

export default Auth;