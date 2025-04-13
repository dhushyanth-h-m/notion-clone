import React, { useState } from 'react';
import './Login.css';
import GoogleLoginButton from '../GoogleLogin/GoogleLoginButton';
import { useAuth } from '../../context/AuthContext';

interface LoginFormData {
    email: string;
    password: string;
}

const Login: React.FC = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState<LoginFormData> ({
        email: '',
        password: '',
    });
    const [errors, setErrors] = useState<Partial<LoginFormData>>({});
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const validate = (): boolean => {
        const newErrors: Partial<LoginFormData> = {};

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
            <h2>Login to Your Account</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input 
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className={errors.password ? 'error' : ''}
                    />
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <button type="submit" className='login-button'>Login</button>
            </form>
            
            <div className="separator">
                <span>OR</span>
            </div>
            
            <GoogleLoginButton />
        </div>
    );
};

export default Login;

