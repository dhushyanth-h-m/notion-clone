import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import apiClient from '../api/client';

interface User {
    id: string;
    name: string;
    email: string;
};

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: ( token: string ) => void;
    logout: () => void;
    serverError: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within a AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [serverError, setServerError] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (token) {
            fetchUserData(token);
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUserData = async (token: string) => {
        try {
            // Check if we already know the server is down
            if (serverError) {
                console.log("Server connection known to be down, skipping API call");
                setLoading(false);
                return false;
            }

            console.log("Attempting to fetch user data...");
            const response = await apiClient.get('/auth/me');
            
            console.log("User data fetched successfully:", response.data);
            setServerError(false);
            setUser(response.data);
            return true;
        } catch (error) {
            console.error("Error fetching user data:", error);
            
            // Check if it's a connection error
            if (error.code === 'ERR_NETWORK') {
                console.error("Network connection to server failed");
                setServerError(true);
                // Still consider user as logged in if token exists
                // This allows users to see the UI even when server is temporarily down
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (e) {
                        console.error("Error parsing stored user data");
                    }
                }
            } else if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log("Token invalid, removing from localStorage");
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setUser(null);
            }
            return false;
        } finally {
            setLoading(false);
        }
    };

    const login = (token: string) => {
        localStorage.setItem('token', token);
        setLoading(true);
        fetchUserData(token);
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setLoading(false);
    };
    
    return (
        <AuthContext.Provider 
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                serverError,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;