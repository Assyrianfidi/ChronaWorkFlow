import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const success = await login(email, password);
        if (success) {
            navigate('/dashboard');
        }
        else {
            setError('Invalid email or password');
        }
        setIsLoading(false);
    };
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "sm:mx-auto sm:w-full sm:max-w-md", children: [_jsx("div", { className: "flex justify-center", children: _jsx("div", { className: "w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx("span", { className: "text-white font-bold text-xl", children: "A" }) }) }), _jsx("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: "AccuBooks" }), _jsx("p", { className: "mt-2 text-center text-sm text-gray-600", children: "Enterprise Financial Management System" })] }), _jsx("div", { className: "mt-8 sm:mx-auto sm:w-full sm:max-w-md", children: _jsxs("div", { className: "bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10", children: [_jsxs("form", { className: "space-y-6", onSubmit: handleSubmit, children: [error && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-4", children: _jsx("div", { className: "text-sm text-red-600", children: error }) })), _jsxs("div", { children: [_jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700", children: "Email address" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", placeholder: "Enter your email" }) })] }), _jsxs("div", { children: [_jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700", children: "Password" }), _jsx("div", { className: "mt-1", children: _jsx("input", { id: "password", name: "password", type: "password", autoComplete: "current-password", required: true, value: password, onChange: (e) => setPassword(e.target.value), className: "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm", placeholder: "Enter your password" }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("input", { id: "remember-me", name: "remember-me", type: "checkbox", className: "h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" }), _jsx("label", { htmlFor: "remember-me", className: "ml-2 block text-sm text-gray-900", children: "Remember me" })] }), _jsx("div", { className: "text-sm", children: _jsx("a", { href: "#", className: "font-medium text-blue-600 hover:text-blue-500", children: "Forgot your password?" }) })] }), _jsx("div", { children: _jsx("button", { type: "submit", disabled: isLoading, className: "w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed", children: isLoading ? 'Signing in...' : 'Sign in' }) })] }), _jsxs("div", { className: "mt-6", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 flex items-center", children: _jsx("div", { className: "w-full border-t border-gray-300" }) }), _jsx("div", { className: "relative flex justify-center text-sm", children: _jsx("span", { className: "px-2 bg-white text-gray-500", children: "Demo Accounts" }) })] }), _jsx("div", { className: "mt-6 grid grid-cols-1 gap-3", children: _jsxs("div", { className: "text-xs text-gray-500 space-y-1", children: [_jsxs("p", { children: [_jsx("strong", { children: "CFO:" }), " cfo@accubooks.com"] }), _jsxs("p", { children: [_jsx("strong", { children: "Controller:" }), " controller@accubooks.com"] }), _jsxs("p", { children: [_jsx("strong", { children: "Project Manager:" }), " pm@accubooks.com"] }), _jsxs("p", { children: [_jsx("strong", { children: "Accountant:" }), " accountant@accubooks.com"] }), _jsxs("p", { className: "mt-2", children: [_jsx("strong", { children: "Password:" }), " password123"] })] }) })] })] }) })] }));
};
export default Login;
