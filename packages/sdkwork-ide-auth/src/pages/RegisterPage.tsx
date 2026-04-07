import React from 'react';
import { Button } from 'sdkwork-ide-ui';

export function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0e0e11] text-white">
      <div className="w-full max-w-md p-8 bg-[#18181b] rounded-xl border border-white/10 shadow-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Create an Account</h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
            <input type="text" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" placeholder="Enter your name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input type="email" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" placeholder="Enter your email" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Password</label>
            <input type="password" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-gray-600" placeholder="Create a password" />
          </div>
          <Button className="w-full mt-2 py-2.5 bg-white text-black hover:bg-gray-200 font-medium rounded-lg transition-colors">
            Sign Up
          </Button>
          <div className="text-center text-sm text-gray-400 mt-4">
            Already have an account? <a href="#" className="text-white hover:text-gray-300 transition-colors">Sign In</a>
          </div>
        </div>
      </div>
    </div>
  );
}
