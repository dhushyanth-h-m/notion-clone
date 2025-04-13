import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

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
            const response = await fetch('http://localhost:5001/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                const status = response.status;
                if (status === 401 || status === 403) {
                    console.log("Token invalid, removing from localStorage");
                    localStorage.removeItem('token');
                } else {
                    console.log(`Error fetching user data: ${status}`, await response.text());
                }
            }
        } catch (error) {
            console.log("Error fetching user data", error);
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