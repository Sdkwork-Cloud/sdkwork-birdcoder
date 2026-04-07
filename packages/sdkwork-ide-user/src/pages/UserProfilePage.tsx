import React, { useState } from 'react';
import { User as UserIcon, Mail, Shield, Key, MapPin, Link as LinkIcon, Building, LogOut, AlertTriangle, Camera, Edit2, Check, X } from 'lucide-react';
import { Button } from 'sdkwork-ide-ui';
import { useAuth, useToast } from 'sdkwork-ide-commons';

export function UserProfilePage() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(() => localStorage.getItem('sdkwork_user_bio') || 'Full Stack Developer passionate about building great tools.');
  const [company, setCompany] = useState(() => localStorage.getItem('sdkwork_user_company') || 'SDKWork Inc.');
  const [location, setLocation] = useState(() => localStorage.getItem('sdkwork_user_location') || 'San Francisco, CA');
  const [website, setWebsite] = useState(() => localStorage.getItem('sdkwork_user_website') || 'https://sdkwork.com');

  const [isChangeEmailVisible, setIsChangeEmailVisible] = useState(false);
  const [isUpdatePasswordVisible, setIsUpdatePasswordVisible] = useState(false);
  const [isDeleteAccountVisible, setIsDeleteAccountVisible] = useState(false);

  const handleSaveProfile = () => {
    localStorage.setItem('sdkwork_user_bio', bio);
    localStorage.setItem('sdkwork_user_company', company);
    localStorage.setItem('sdkwork_user_location', location);
    localStorage.setItem('sdkwork_user_website', website);
    setIsEditing(false);
    addToast('Profile updated successfully', 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0e0e11] text-gray-100 p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Not Signed In</h2>
          <p className="text-gray-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#0e0e11] text-gray-100 p-8 h-full relative">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Account Settings</h1>
          <Button 
            variant="outline" 
            className="border-red-900/30 text-red-400 hover:bg-red-950/50 hover:text-red-300 flex items-center gap-2 transition-colors"
            onClick={logout}
          >
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="col-span-1 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '0ms' }}>
            <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6 flex flex-col items-center text-center shadow-lg">
              <div className="relative group cursor-pointer mb-5">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Avatar" className="w-28 h-28 rounded-full border border-white/10 object-cover shadow-xl" />
                ) : (
                  <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl">
                    <span className="text-4xl font-bold text-white">{user.name?.charAt(0) || 'U'}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <h2 className="text-xl font-semibold mb-1 text-gray-100">{name || user.name}</h2>
              <p className="text-gray-400 text-sm mb-6">{user.email}</p>
              
              <div className="w-full flex flex-col gap-3.5 text-sm text-gray-300 text-left">
                <div className="flex items-center gap-3">
                  <Building size={16} className="text-gray-500 shrink-0" />
                  <span className="truncate">{company}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-gray-500 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <LinkIcon size={16} className="text-gray-500 shrink-0" />
                  <a href={website} className="text-blue-400 hover:underline truncate" target="_blank" rel="noopener noreferrer">
                    {website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Column - Settings */}
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            
            {/* Public Profile */}
            <div className="bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '50ms' }}>
              <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div>
                  <h3 className="text-base font-medium text-gray-200">Public Profile</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Manage how your profile appears to others.</p>
                </div>
                <Button 
                  variant={isEditing ? "default" : "outline"} 
                  onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                  className={isEditing ? "bg-white text-black hover:bg-gray-200" : "border-white/10 bg-transparent hover:bg-white/5 text-gray-300"}
                  size="sm"
                >
                  {isEditing ? (
                    <><Check size={14} className="mr-1.5" /> Save Changes</>
                  ) : (
                    <><Edit2 size={14} className="mr-1.5" /> Edit Profile</>
                  )}
                </Button>
              </div>
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Bio</label>
                  <textarea 
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 resize-none transition-all custom-scrollbar" 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Company</label>
                    <input 
                      type="text" 
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 transition-all" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Location</label>
                    <input 
                      type="text" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      disabled={!isEditing}
                      className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 transition-all" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Website</label>
                  <input 
                    type="url" 
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    disabled={!isEditing}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-60 disabled:bg-transparent disabled:border-transparent disabled:px-0 transition-all" 
                  />
                </div>
              </div>
            </div>
            
            {/* Account Security */}
            <div className="bg-[#18181b] rounded-2xl border border-white/10 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '100ms' }}>
              <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-base font-medium flex items-center gap-2 text-gray-200">
                  <Shield size={18} className="text-blue-400" /> Account Security
                </h3>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <Mail size={18} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-200 text-sm">Email Address</p>
                      <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-2.5 py-1 bg-green-500/10 text-green-400 text-[10px] rounded-full border border-green-500/20 font-medium uppercase tracking-wider">Verified</span>
                    <Button variant="outline" size="sm" className="border-white/10 bg-transparent hover:bg-white/5 text-gray-300" onClick={() => setIsChangeEmailVisible(true)}>Change</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                      <Key size={18} className="text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-200 text-sm">Password</p>
                      <p className="text-xs text-gray-400 mt-0.5">Last changed 3 months ago</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/10 bg-transparent hover:bg-white/5 text-gray-300" onClick={() => setIsUpdatePasswordVisible(true)}>Update</Button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-[#18181b] rounded-2xl border border-red-900/30 overflow-hidden shadow-lg animate-in fade-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: '150ms' }}>
              <div className="px-6 py-4 border-b border-red-900/30 bg-red-950/10">
                <h3 className="text-base font-medium text-red-400 flex items-center gap-2">
                  <AlertTriangle size={18} /> Danger Zone
                </h3>
              </div>
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-200 text-sm">Delete Account</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-md">Permanently delete your account and all of your content. This action cannot be undone.</p>
                </div>
                <Button variant="outline" size="sm" className="border-red-900/50 text-red-400 hover:bg-red-950/30 hover:text-red-300 transition-colors" onClick={() => setIsDeleteAccountVisible(true)}>
                  Delete Account
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Modals */}
      {isChangeEmailVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Change Email Address</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New Email Address</label>
                <input type="email" placeholder="new@example.com" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsChangeEmailVisible(false)} className="border-white/10 text-gray-300 hover:bg-white/5">Cancel</Button>
              <Button variant="default" onClick={() => {
                addToast('Verification email sent to new address', 'success');
                setIsChangeEmailVisible(false);
              }} className="bg-blue-600 hover:bg-blue-500 text-white border-transparent">Send Verification</Button>
            </div>
          </div>
        </div>
      )}

      {isUpdatePasswordVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-white mb-4">Update Password</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Confirm New Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-blue-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsUpdatePasswordVisible(false)} className="border-white/10 text-gray-300 hover:bg-white/5">Cancel</Button>
              <Button variant="default" onClick={() => {
                addToast('Password updated successfully', 'success');
                setIsUpdatePasswordVisible(false);
              }} className="bg-blue-600 hover:bg-blue-500 text-white border-transparent">Update Password</Button>
            </div>
          </div>
        </div>
      )}

      {isDeleteAccountVisible && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100]">
          <div className="bg-[#18181b] border border-red-900/30 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-400">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-semibold">Delete Account</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Are you sure you want to permanently delete your account? This action cannot be undone and will permanently delete all your projects, threads, and data.
            </p>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">To confirm, type "delete my account"</label>
                <input type="text" placeholder="delete my account" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
                <input type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDeleteAccountVisible(false)} className="border-white/10 text-gray-300 hover:bg-white/5">Cancel</Button>
              <Button variant="default" onClick={() => {
                addToast('Account deletion initiated', 'error');
                setIsDeleteAccountVisible(false);
                setTimeout(() => logout(), 1500);
              }} className="bg-red-500 hover:bg-red-600 text-white border-transparent">Permanently Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
