import React, { useState } from 'react';
import { Button } from 'sdkwork-ide-ui';
import { useAuth } from 'sdkwork-ide-commons';
import { Github, Chrome, MessageCircle, QrCode, Minus, Square, X } from 'lucide-react';

export function LoginPage() {
  const { login, register, user, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(email, password, name);
    }
  };

  const handleOAuthLogin = async (provider: string) => {
    // Mock OAuth login
    await login(`${provider}_user@example.com`, 'oauth_mock_password');
  };

  if (user) {
    // This shouldn't normally render if App.tsx handles routing, but just in case
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e11] text-gray-100 p-4 font-sans relative">
      {/* Window Controls */}
      <div className="absolute top-0 right-0 h-10 flex items-center pr-2 z-50">
        <button className="h-full px-3 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center rounded-md">
          <Minus size={14} />
        </button>
        <button className="h-full px-3 hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex items-center justify-center rounded-md">
          <Square size={12} />
        </button>
        <button className="h-full px-3 hover:bg-red-500 text-gray-400 hover:text-white transition-colors flex items-center justify-center rounded-md">
          <X size={14} />
        </button>
      </div>

      <div className="w-full max-w-4xl bg-[#18181b] rounded-2xl border border-white/5 shadow-2xl flex overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side - QR Code Login */}
        <div className="hidden md:flex flex-col items-center justify-center w-1/2 bg-[#0e0e11] p-12 border-r border-white/5">
          <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '100ms' }}>
            <h2 className="text-2xl font-semibold tracking-tight text-white mb-2">SDKWork IDE</h2>
            <p className="text-gray-400 text-sm">Scan to log in instantly</p>
          </div>
          
          <div className="bg-white p-4 rounded-2xl shadow-inner mb-8 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '200ms' }}>
            {/* Mock QR Code using Lucide icon as placeholder */}
            <div className="w-48 h-48 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200">
              <QrCode size={120} className="text-gray-800" />
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '300ms' }}>
            <p>Open the mobile app and scan the QR code</p>
            <p className="mt-1">to securely sign in to your workspace.</p>
          </div>
        </div>

        {/* Right Side - Form & OAuth */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-[#18181b]">
          <h2 className="text-2xl font-semibold tracking-tight mb-6 text-center text-gray-100 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '100ms' }}>{isLogin ? 'Sign In to SDKWork' : 'Create an Account'}</h2>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '200ms' }}>
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                  placeholder="Enter your name" 
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                placeholder="Enter your email" 
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" 
                placeholder="Enter your password" 
              />
            </div>
            <Button type="submit" className="w-full mt-2 py-2.5 bg-white text-black hover:bg-gray-200 font-medium rounded-lg transition-colors">
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
            
            <div className="flex justify-between text-sm text-gray-400 mt-2">
              {isLogin ? (
                <>
                  <a href="#" className="hover:text-white transition-colors">Forgot Password?</a>
                  <button type="button" onClick={() => setIsLogin(false)} className="hover:text-white transition-colors">Create Account</button>
                </>
              ) : (
                <button type="button" onClick={() => setIsLogin(true)} className="hover:text-white transition-colors w-full text-center">Already have an account? Sign In</button>
              )}
            </div>
          </form>

          <div className="relative flex items-center py-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '300ms' }}>
            <div className="flex-grow border-t border-white/10"></div>
            <span className="flex-shrink-0 mx-4 text-gray-500 text-xs uppercase tracking-wider font-medium">Or continue with</span>
            <div className="flex-grow border-t border-white/10"></div>
          </div>

          <div className="flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '400ms' }}>
            <button 
              type="button"
              onClick={() => handleOAuthLogin('github')}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Github size={18} />
              <span>Continue with GitHub</span>
            </button>
            <button 
              type="button"
              onClick={() => handleOAuthLogin('google')}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
            >
              <Chrome size={18} />
              <span>Continue with Google</span>
            </button>
            <button 
              type="button"
              onClick={() => handleOAuthLogin('wechat')}
              className="w-full flex items-center justify-center gap-3 bg-white/[0.03] hover:bg-white/5 border border-white/10 text-gray-300 hover:text-white py-2.5 rounded-lg transition-colors text-sm font-medium"
            >
              <MessageCircle size={18} className="text-[#07C160]" />
              <span>Continue with WeChat</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
