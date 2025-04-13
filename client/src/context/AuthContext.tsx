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
            const response = await apiClient.get('/auth/me');
            
            console.log("User data fetched successfully:", response.data);
            
            setUser(response.data);
        } catch (error) {
            console.error("Error fetching user data:", error);
            
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log("Token invalid, removing from localStorage");
                localStorage.removeItem('token');
            }
        } finally {
            setLoading(false);
        }
    };

    const login = ( token: string ) => {
        localStorage.setItem('token', token);
        setLoading(true);
        fetchUserData(token);
    }

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setLoading(false);
    };
    
    return (
        <AuthContext.Provider 
            value={{
                user,
                loading,
                isAuthenticated: !!user,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export default AuthProvider;