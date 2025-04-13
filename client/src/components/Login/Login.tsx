import React, { useState } from 'react';
import './Login.css';
import { useAuth } from '../../context/AuthContext';

interface LoginFormData {
    email: string;
    password: string;
    rememberMe: boolean;
}

const Login: React.FC = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState<LoginFormData> ({
        email: '',
        password: '',
        rememberMe: false
    });
    const [errors, setErrors] = useState<Partial<Omit<LoginFormData, 'rememberMe'>>>({});
    const [showPassword, setShowPassword] = useState(false);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const validate = (): boolean => {
        const newErrors: Partial<Omit<LoginFormData, 'rememberMe'>> = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validate()) {
            try {
                const response = await fetch('http://localhost:5001/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData),
                });

                const data = await response.json();

                if (response.ok) {
                    console.log('Login successful', data);
                    login(data.token);
                } else {
                    setErrors({ email: data.message });
                }
            } catch (error) {
                console.log('Login failed', error);
                setErrors({ email: 'Login failed. Please try again.' });
            }
        }
    };

    return (
        <div className="login-form">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email"
                        id="email"
                        name="email"
                        placeholder="m@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                        <input 
                            type={showPassword ? "text" : "password"}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className={errors.password ? 'error' : ''}
                        />
                        <span 
                            className="password-toggle-icon" 
                            onClick={togglePasswordVisibility}
                        >
                            {showPassword ? '👁️' : '👁️‍🗨️'}
                        </span>
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <div className="form-options">
                    <div className="remember-me">
                        <input 
                            type="checkbox" 
                            id="rememberMe" 
                            name="rememberMe"
                            checked={formData.rememberMe}
                            onChange={handleChange}
                        />
                        <label htmlFor="rememberMe">Remember me</label>
                    </div>
                    <a href="#" className="forgot-password">Forgot password?</a>
                </div>

                <button type="submit" className="login-button">Sign In</button>
            </form>
        </div>
    );
};

export default Login;

