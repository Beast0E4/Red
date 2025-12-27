import { useState } from "react";
import { X, User, Shield, Bell, Key, Palette, Globe, Save, Camera, Mail, Phone, Calendar, MapPin, Edit2, Check, Trash2, LogOut, ChevronRight } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/auth.slice";
import { useNavigate } from "react-router-dom";

export default function ProfileSettings() {
    const authState = useSelector ((state) => state.auth);
    
    const dispatch = useDispatch ();
    const navigate = useNavigate ();

    const [activeTab, setActiveTab] = useState("profile");
    const [showSettings, setShowSettings] = useState(true);
    
    // Form states
    const [username, setUsername] = useState(authState.data?.username);
    const [email, setEmail] = useState(authState.data?.email);
    const [phone, setPhone] = useState("+1 234 567 8900");
    const [bio, setBio] = useState("Hey there! I'm using this chat app.");
    const [dateOfBirth, setDateOfBirth] = useState("1995-06-15");
    const [location, setLocation] = useState("San Francisco, CA");
    
    // Settings states
    const [notifications, setNotifications] = useState({
        messages: true,
        mentions: true,
        sounds: true,
        desktop: true
    });
    
    const [privacy, setPrivacy] = useState({
        readReceipts: true,
        lastSeen: true,
        profilePhoto: "everyone"
    });
    
    const [theme, setTheme] = useState("dark");
    const [language, setLanguage] = useState("english");
    
    const [isEditing, setIsEditing] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const tabs = [
        { id: "profile", label: "My Account", icon: User },
        { id: "privacy", label: "Privacy & Safety", icon: Shield },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "appearance", label: "Appearance", icon: Palette },
        { id: "language", label: "Language", icon: Globe },
        { id: "security", label: "Security", icon: Key }
    ];

    const handleSave = () => {
        setHasChanges(false);
        setIsEditing(false);
        // Save logic here
    };

    const handleChange = () => {
        setHasChanges(true);
    };

    const onLogout = () => {
        dispatch (logout ());

        navigate ('/login'); return;
    }

    return (
        <div className="h-screen flex bg-[#313338] text-gray-100 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-[218px] bg-[#2b2d31] flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scrollbar py-14 px-2">
                    <div className="space-y-0.5">
                        <div className="px-2.5 py-1.5 mb-2">
                            <h2 className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">
                                User Settings
                            </h2>
                        </div>
                        
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`
                                        w-full px-2.5 py-1.5 rounded flex items-center gap-3 text-[15px] font-medium
                                        transition-all duration-150
                                        ${activeTab === tab.id 
                                            ? "bg-[#404249] text-white" 
                                            : "text-[#b5bac1] hover:bg-[#35363c] hover:text-[#dbdee1]"}
                                    `}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}

                        <div className="h-px bg-[#3f4147] my-2" />

                        <button onClick={onLogout} className="w-full px-2.5 py-1.5 rounded flex items-center gap-3 text-[15px] font-medium text-[#f23f43] hover:bg-[#35363c] hover:text-[#f85b5f] transition-all">
                            <LogOut className="w-5 h-5" />
                            Log Out
                        </button>
                    </div>
                </div>

                <div className="p-4 border-t border-black/20">
                    <button
                        onClick={() => navigate (-1)}
                        className="w-full px-3 py-2 bg-[#35363c] hover:bg-[#3f4147] text-white rounded flex items-center justify-center gap-2 text-sm font-medium transition-colors"
                    >
                        <X className="w-4 h-4" />
                        Close Settings
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <div className="h-14 px-8 flex items-center justify-between border-b border-black/20 bg-[#313338]">
                    <div>
                        <h1 className="text-xl font-bold text-white">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                    </div>
                    {hasChanges && (
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-[#949ba4]">Careful — you have unsaved changes!</span>
                            <button
                                onClick={() => {
                                    setHasChanges(false);
                                    setIsEditing(false);
                                }}
                                className="px-4 py-2 text-white text-sm hover:underline"
                            >
                                Reset
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-[#23a559] hover:bg-[#1e8e4f] text-white rounded text-sm font-medium transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="max-w-[740px] px-8 py-12">
                        
                        {/* Profile Tab */}
                        {activeTab === "profile" && (
                            <div className="space-y-8">
                                {/* Profile Banner */}
                                <div className="relative">
                                    <div className="h-[100px] bg-gradient-to-r from-[#5865f2] to-[#7289da] rounded-lg relative overflow-hidden">
                                        <div className="absolute inset-0 bg-black/20" />
                                        <button className="absolute top-3 right-3 p-2 bg-black/40 hover:bg-black/60 rounded-full transition-colors">
                                            <Camera className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                    
                                    {/* Avatar */}
                                    <div className="absolute -bottom-12 left-6">
                                        <div className="relative">
                                            <div className="w-[80px] h-[80px] rounded-full bg-[#5865f2] border-[6px] border-[#313338] flex items-center justify-center text-white font-bold text-2xl">
                                                {username.charAt(0).toUpperCase()}
                                            </div>
                                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-[#5865f2] hover:bg-[#4752c4] rounded-full flex items-center justify-center border-[3px] border-[#313338] transition-colors">
                                                <Camera className="w-4 h-4 text-white" />
                                            </button>
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#23a559] rounded-full border-[3px] border-[#313338]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-14 space-y-6">
                                    {/* Username */}
                                    <div className="bg-[#2b2d31] rounded-lg p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h3 className="text-xs font-bold text-[#b5bac1] uppercase mb-2">Username</h3>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={username}
                                                        onChange={(e) => {
                                                            setUsername(e.target.value);
                                                            handleChange();
                                                        }}
                                                        className="bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                                    />
                                                ) : (
                                                    <p className="text-white text-[15px] font-medium">{username}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => setIsEditing(!isEditing)}
                                                className="px-4 py-2 bg-[#4e5058] hover:bg-[#5d5f67] text-white text-sm rounded transition-colors"
                                            >
                                                {isEditing ? "Cancel" : "Edit"}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="bg-[#2b2d31] rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Mail className="w-5 h-5 text-[#b5bac1]" />
                                            <h3 className="text-xs font-bold text-[#b5bac1] uppercase">Email</h3>
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                handleChange();
                                            }}
                                            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                        />
                                    </div>

                                    {/* Phone */}
                                    <div className="bg-[#2b2d31] rounded-lg p-6">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Phone className="w-5 h-5 text-[#b5bac1]" />
                                            <h3 className="text-xs font-bold text-[#b5bac1] uppercase">Phone</h3>
                                        </div>
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => {
                                                setPhone(e.target.value);
                                                handleChange();
                                            }}
                                            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                        />
                                    </div>

                                    {/* Bio */}
                                    <div className="bg-[#2b2d31] rounded-lg p-6">
                                        <h3 className="text-xs font-bold text-[#b5bac1] uppercase mb-2">About Me</h3>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => {
                                                setBio(e.target.value);
                                                handleChange();
                                            }}
                                            rows={4}
                                            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2] resize-none"
                                            placeholder="Tell us about yourself..."
                                        />
                                        <div className="mt-2 text-xs text-[#949ba4]">
                                            {bio.length}/190
                                        </div>
                                    </div>

                                    {/* Additional Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-[#2b2d31] rounded-lg p-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Calendar className="w-5 h-5 text-[#b5bac1]" />
                                                <h3 className="text-xs font-bold text-[#b5bac1] uppercase">Date of Birth</h3>
                                            </div>
                                            <input
                                                type="date"
                                                value={dateOfBirth}
                                                onChange={(e) => {
                                                    setDateOfBirth(e.target.value);
                                                    handleChange();
                                                }}
                                                className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                            />
                                        </div>

                                        <div className="bg-[#2b2d31] rounded-lg p-6">
                                            <div className="flex items-center gap-3 mb-2">
                                                <MapPin className="w-5 h-5 text-[#b5bac1]" />
                                                <h3 className="text-xs font-bold text-[#b5bac1] uppercase">Location</h3>
                                            </div>
                                            <input
                                                type="text"
                                                value={location}
                                                onChange={(e) => {
                                                    setLocation(e.target.value);
                                                    handleChange();
                                                }}
                                                className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                                placeholder="City, Country"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Privacy Tab */}
                        {activeTab === "privacy" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Privacy & Safety</h2>
                                    <p className="text-[#b5bac1] text-sm">Control who can see your information and how you interact with others.</p>
                                </div>

                                <div className="bg-[#2b2d31] rounded-lg divide-y divide-[#1e1f22]">
                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Read Receipts</h3>
                                            <p className="text-sm text-[#b5bac1]">Let others know when you've read their messages</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacy.readReceipts}
                                                onChange={(e) => {
                                                    setPrivacy({...privacy, readReceipts: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>

                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Last Seen</h3>
                                            <p className="text-sm text-[#b5bac1]">Show when you were last active</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={privacy.lastSeen}
                                                onChange={(e) => {
                                                    setPrivacy({...privacy, lastSeen: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>

                                    <div className="p-6">
                                        <div className="mb-4">
                                            <h3 className="text-white font-medium mb-1">Profile Photo</h3>
                                            <p className="text-sm text-[#b5bac1]">Who can see your profile photo</p>
                                        </div>
                                        <select
                                            value={privacy.profilePhoto}
                                            onChange={(e) => {
                                                setPrivacy({...privacy, profilePhoto: e.target.value});
                                                handleChange();
                                            }}
                                            className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                        >
                                            <option value="everyone">Everyone</option>
                                            <option value="contacts">My Contacts</option>
                                            <option value="nobody">Nobody</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === "notifications" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Notifications</h2>
                                    <p className="text-[#b5bac1] text-sm">Choose what notifications you want to receive.</p>
                                </div>

                                <div className="bg-[#2b2d31] rounded-lg divide-y divide-[#1e1f22]">
                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Direct Messages</h3>
                                            <p className="text-sm text-[#b5bac1]">Get notified when you receive messages</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.messages}
                                                onChange={(e) => {
                                                    setNotifications({...notifications, messages: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>

                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Mentions</h3>
                                            <p className="text-sm text-[#b5bac1]">Get notified when someone mentions you</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.mentions}
                                                onChange={(e) => {
                                                    setNotifications({...notifications, mentions: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>

                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Notification Sounds</h3>
                                            <p className="text-sm text-[#b5bac1]">Play sounds for notifications</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.sounds}
                                                onChange={(e) => {
                                                    setNotifications({...notifications, sounds: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>

                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Desktop Notifications</h3>
                                            <p className="text-sm text-[#b5bac1]">Show notifications on your desktop</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={notifications.desktop}
                                                onChange={(e) => {
                                                    setNotifications({...notifications, desktop: e.target.checked});
                                                    handleChange();
                                                }}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-[#4e5058] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#23a559]"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Appearance Tab */}
                        {activeTab === "appearance" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Appearance</h2>
                                    <p className="text-[#b5bac1] text-sm">Customize how your app looks.</p>
                                </div>

                                <div className="bg-[#2b2d31] rounded-lg p-6">
                                    <h3 className="text-white font-medium mb-4">Theme</h3>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'dark', label: 'Dark', bg: '#313338' },
                                            { id: 'light', label: 'Light', bg: '#ffffff' },
                                            { id: 'midnight', label: 'Midnight', bg: '#0a0a0a' }
                                        ].map((themeOption) => (
                                            <button
                                                key={themeOption.id}
                                                onClick={() => {
                                                    setTheme(themeOption.id);
                                                    handleChange();
                                                }}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    theme === themeOption.id 
                                                        ? 'border-[#5865f2]' 
                                                        : 'border-[#1e1f22] hover:border-[#3f4147]'
                                                }`}
                                            >
                                                <div 
                                                    className="w-full h-20 rounded mb-2"
                                                    style={{ backgroundColor: themeOption.bg }}
                                                />
                                                <p className="text-white text-sm font-medium">{themeOption.label}</p>
                                                {theme === themeOption.id && (
                                                    <Check className="w-4 h-4 text-[#5865f2] mx-auto mt-2" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Language Tab */}
                        {activeTab === "language" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Language</h2>
                                    <p className="text-[#b5bac1] text-sm">Select your preferred language.</p>
                                </div>

                                <div className="bg-[#2b2d31] rounded-lg p-6">
                                    <select
                                        value={language}
                                        onChange={(e) => {
                                            setLanguage(e.target.value);
                                            handleChange();
                                        }}
                                        className="w-full bg-[#1e1f22] text-white px-3 py-2 rounded text-[15px] outline-none focus:ring-2 focus:ring-[#5865f2]"
                                    >
                                        <option value="english">English (US)</option>
                                        <option value="spanish">Español</option>
                                        <option value="french">Français</option>
                                        <option value="german">Deutsch</option>
                                        <option value="japanese">日本語</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === "security" && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-2">Security</h2>
                                    <p className="text-[#b5bac1] text-sm">Manage your account security settings.</p>
                                </div>

                                <div className="space-y-4">
                                    <button className="w-full bg-[#2b2d31] hover:bg-[#35363c] rounded-lg p-6 flex items-center justify-between transition-colors text-left">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Change Password</h3>
                                            <p className="text-sm text-[#b5bac1]">Update your account password</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#b5bac1]" />
                                    </button>

                                    <button className="w-full bg-[#2b2d31] hover:bg-[#35363c] rounded-lg p-6 flex items-center justify-between transition-colors text-left">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Two-Factor Authentication</h3>
                                            <p className="text-sm text-[#b5bac1]">Add an extra layer of security</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#b5bac1]" />
                                    </button>

                                    <button className="w-full bg-[#2b2d31] hover:bg-[#35363c] rounded-lg p-6 flex items-center justify-between transition-colors text-left">
                                        <div>
                                            <h3 className="text-white font-medium mb-1">Active Sessions</h3>
                                            <p className="text-sm text-[#b5bac1]">Manage devices where you're logged in</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-[#b5bac1]" />
                                    </button>

                                    <div className="bg-[#f23f43]/10 border border-[#f23f43]/30 rounded-lg p-6 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[#f23f43] font-bold mb-1">Delete Account</h3>
                                            <p className="text-sm text-[#b5bac1]">This action cannot be undone. All your data will be permanently lost.</p>
                                        </div>
                                        <button className="px-4 py-2 bg-[#f23f43] hover:bg-[#d9363a] text-white rounded font-medium text-sm transition-colors flex items-center gap-2">
                                            <Trash2 className="w-4 h-4" />
                                            Delete Account
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}