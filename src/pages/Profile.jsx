import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Target, Camera, AlertTriangle, Save, X, Trash2, 
  Award, Calendar, Activity, Edit3, CheckCircle, Upload,
  Zap, TrendingUp, Shield, Globe, Bell, Lock, Crown
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const Profile = () => {
  const { user, logout, updateTokenUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    fitnessGoals: user?.fitnessGoals || '',
    preferences: user?.preferences || { theme: 'dark', units: 'lbs', notificationsEnabled: true },
    profileData: user?.profileData || {
      age: '', weight: '', height: '', goal: '', activityLevel: '',
      sleepHours: '', stressLevel: '', medicalConditions: '', workoutExperience: '', dietPreference: ''
    }
  });
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [cloudinaryStatus, setCloudinaryStatus] = useState(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const edit = params.get('edit');
    if (tab) setActiveTab(tab);
    if (edit === 'true') setIsEditing(true);
  }, []);

  // Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  
  const fileInputRef = useRef();

  // Check Cloudinary status on mount
  useEffect(() => {
    const checkCloudinary = async () => {
      try {
        const { data } = await api.get('/users/cloudinary-status');
        setCloudinaryStatus(data);
        if (!data.configured) {
          toast.error('Image upload service is not configured. Please contact support.', {
            duration: 5000
          });
        }
      } catch (error) {
        console.error('Failed to check Cloudinary status:', error);
      }
    };
    checkCloudinary();
  }, []);

  // Stats data
  const stats = {
    workoutsCompleted: 48,
    currentStreak: 7,
    totalXp: user?.gamification?.xp || 2450,
    memberSince: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'January 2024'
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image too large! Maximum 5MB.");
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file.");
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

 const handleSave = async () => {
  try {
    setIsLoading(true);
    const loadToast = toast.loading('Updating profile...');
    
    const payload = {
      name: formData.name,
      fitnessGoals: formData.fitnessGoals,
      preferences: formData.preferences,
      profileData: formData.profileData
    };

    // Handle avatar upload if there's a new image
    if (avatarFile) {
      console.log('📸 Processing avatar file:', avatarFile.name, avatarFile.size, 'bytes');
      
      // Check file size (5MB limit)
      if (avatarFile.size > 5 * 1024 * 1024) {
        toast.error('Image too large! Maximum 5MB.', { id: loadToast });
        setIsLoading(false);
        return;
      }

      // Check file type
      if (!avatarFile.type.startsWith('image/')) {
        toast.error('Please select an image file (JPG, PNG, GIF).', { id: loadToast });
        setIsLoading(false);
        return;
      }

      // Check Cloudinary status first
      try {
        console.log('🔍 Checking Cloudinary status...');
        const { data: cloudinaryStatus } = await api.get('/users/cloudinary-status');
        console.log('Cloudinary status:', cloudinaryStatus);
        
        if (!cloudinaryStatus.configured) {
          console.error('Cloudinary not configured:', cloudinaryStatus.message);
          
          // If Cloudinary is not configured, we can still update other profile info
          const shouldContinue = window.confirm(
            'Image upload service is currently unavailable. Would you like to save other profile changes without updating the profile picture?'
          );
          
          if (shouldContinue) {
            // Continue without image
            toast.success('Continuing without image upload...', { id: loadToast });
            // Don't include avatar in payload
          } else {
            toast.error('Profile update cancelled.', { id: loadToast });
            setIsLoading(false);
            return;
          }
        } else {
          // Cloudinary is configured, proceed with image upload
          console.log('✅ Cloudinary is configured, converting image to base64...');
          
          const reader = new FileReader();
          
          const base64Promise = new Promise((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result;
              if (result && result.includes('base64')) {
                console.log('✅ Image converted to base64');
                resolve(result);
              } else {
                reject(new Error('Invalid base64 conversion'));
              }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.onabort = () => reject(new Error('File reading aborted'));
            
            // Set timeout for large files
            setTimeout(() => reject(new Error('File reading timeout')), 30000);
          });
          
          reader.readAsDataURL(avatarFile);
          
          try {
            const avatarBase64 = await base64Promise;
            payload.avatarBase64 = avatarBase64;
            console.log('✅ Image ready for upload');
          } catch (conversionError) {
            console.error('Image conversion error:', conversionError);
            toast.error('Failed to process image. Please try a different image.', {
              id: loadToast
            });
            setIsLoading(false);
            return;
          }
        }
      } catch (statusError) {
        console.error('Failed to check Cloudinary status:', statusError);
        
        // Check if it's a network error
        if (statusError.code === 'ERR_NETWORK' || statusError.message.includes('Network Error')) {
          toast.error('Network error. Please check your connection.', { id: loadToast });
        } else {
          // Continue without image upload option
          const shouldContinue = window.confirm(
            'Unable to verify upload service. Would you like to save other profile changes without updating the profile picture?'
          );
          
          if (!shouldContinue) {
            toast.error('Profile update cancelled.', { id: loadToast });
            setIsLoading(false);
            return;
          }
        }
      }
    }

    console.log('📤 Sending profile update request...');
    const { data } = await api.put('/users/profile', payload);
    
    toast.success('Profile updated successfully!', { 
      id: loadToast,
      icon: '✅',
      duration: 3000
    });
    
    if(updateTokenUser) {
      updateTokenUser(data.data);
    }
    
    setIsEditing(false);
    setAvatarFile(null);
    
  } catch (error) {
    console.error('Update error:', error);
    console.error('Error response:', error.response?.data);
    
    let errorMessage = 'Failed to update profile';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    toast.error(errorMessage, {
      duration: 5000
    });
  } finally {
    setIsLoading(false);
  }
};

  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      toast.error('Please type DELETE to confirm.');
      return;
    }
    try {
      const loadToast = toast.loading('Deleting account permanently...');
      await api.delete('/users/profile');
      toast.success('Account deleted successfully.', { id: loadToast });
      setTimeout(() => logout(), 1500);
    } catch (error) {
      toast.error('Error deleting account. Please try again.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      fitnessGoals: user?.fitnessGoals || '',
      preferences: user?.preferences || { theme: 'dark', units: 'lbs', notificationsEnabled: true },
      profileData: user?.profileData || {
        age: '', weight: '', height: '', goal: '', activityLevel: '',
        sleepHours: '', stressLevel: '', medicalConditions: '', workoutExperience: '', dietPreference: ''
      }
    });
    setAvatarPreview(user?.avatar || '');
    setAvatarFile(null);
    setIsEditing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'metrics', label: 'Health Metrics', icon: Activity },
    { id: 'preferences', label: 'Preferences', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Member since {stats.memberSince}
            </p>
          </div>
          
          <div className="flex gap-3">
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-500 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" /> Edit Profile
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCancel} 
                  className="px-6 py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600 transition flex items-center gap-2"
                >
                  <X className="h-4 w-4"/> Cancel
                </button>
                <button 
                  onClick={handleSave} 
                  disabled={isLoading}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl font-semibold hover:from-green-500 hover:to-green-400 transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Workouts</p>
                <p className="text-3xl font-bold text-white">{stats.workoutsCompleted}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 bg-opacity-20">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Day Streak</p>
                <p className="text-3xl font-bold text-white">{stats.currentStreak}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 bg-opacity-20">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total XP</p>
                <p className="text-3xl font-bold text-white">{stats.totalXp}</p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 bg-opacity-20">
                <Zap className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700/50">
              <div className="flex flex-col items-center">
                {/* Avatar Section */}
                <div className="relative group mb-6">
                  <div className="relative">
                    <div className="h-40 w-40 rounded-full overflow-hidden border-4 border-blue-500/30 shadow-2xl">
                      {avatarPreview ? (
                        <img 
                          src={avatarPreview} 
                          alt="Avatar" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                          <User className="h-20 w-20 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="relative z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            onClick={() => fileInputRef.current.click()}
                            className="p-2 bg-blue-500 rounded-full hover:bg-blue-400 transition-colors shadow-lg"
                            title="Upload new photo"
                          >
                            <Upload className="h-5 w-5 text-white" />
                          </button>
                          {avatarPreview && avatarPreview !== user?.avatar && (
                            <button
                              onClick={handleRemoveImage}
                              className="p-2 bg-red-500 rounded-full hover:bg-red-400 transition-colors shadow-lg"
                              title="Remove photo"
                            >
                              <X className="h-5 w-5 text-white" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                  />
                  
                  {isEditing && (
                    <p className="text-xs text-gray-400 text-center mt-3">
                      Click to upload • JPG, PNG, GIF • Max 5MB
                    </p>
                  )}
                </div>

                {/* User Info */}
                <div className="text-center w-full">
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="text-2xl font-bold text-white bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-center w-full focus:outline-none focus:border-blue-500 transition-colors mb-2"
                      placeholder="Your name"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold text-white mb-2">{formData.name}</h2>
                  )}
                  <div className="flex items-center justify-center gap-2 text-gray-400 mb-4">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 mt-6 w-full">
                    <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 shadow-lg ${
                      user?.subscription?.plan === 'ELITE' 
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' 
                        : user?.subscription?.plan === 'PRO'
                        ? 'bg-accent/20 border-accent/30 text-accent'
                        : 'bg-slate-700/50 border-white/10 text-gray-400'
                    }`}>
                      {user?.subscription?.plan === 'ELITE' ? <Crown className="h-4 w-4" /> : user?.subscription?.plan === 'PRO' ? <Zap className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      <span className="text-xs font-black uppercase tracking-widest">
                        {user?.subscription?.plan || 'FREE'} Plan
                      </span>
                    </div>

                    {user?.subscription?.plan !== 'ELITE' && (
                      <Link to="/subscription" className="text-xs font-bold text-gray-400 hover:text-white transition flex items-center gap-1">
                         Upgrade your performance <TrendingUp className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Benefits Card */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/5 bg-gradient-to-br from-slate-800/80 to-slate-900/80">
                <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent" /> Active Protocols
                </h3>
                <div className="space-y-3">
                    {[
                      { name: 'Basic Tracking', free: true },
                      { name: 'AI Strategic Coach', pro: true, elite: true },
                      { name: 'Daily Habit Clusters', pro: true, elite: true },
                      { name: 'Premium Analytics', pro: true, elite: true },
                      { name: 'Predictive Weight Forecast', elite: true },
                      { name: 'Muscle Distribution Charts', elite: true },
                      { name: 'Elite AI Goal Design', elite: true }
                    ].map((benefit, idx) => {
                        const isUnlocked = 
                            (benefit.free) || 
                            (benefit.pro && (user?.subscription?.plan === 'PRO' || user?.subscription?.plan === 'ELITE')) ||
                            (benefit.elite && user?.subscription?.plan === 'ELITE');
                        
                        return (
                          <div key={idx} className={`flex items-center justify-between p-2 rounded-lg ${isUnlocked ? 'bg-white/5' : 'opacity-30 grayscale'}`}>
                             <span className="text-xs font-medium text-gray-300">{benefit.name}</span>
                             {isUnlocked ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Lock className="h-3 w-3 text-gray-600" />}
                          </div>
                        )
                    })}
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-red-500/20">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h3>
                  <p className="text-sm text-gray-400 mb-4">
                    Once you delete your account, all your data including workouts, nutrition logs, and progress will be permanently removed.
                  </p>
                  <button 
                    onClick={() => setShowDeleteModal(true)} 
                    className="w-full py-2.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 font-medium"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex gap-2 bg-slate-800/30 p-1 rounded-xl backdrop-blur-sm">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                      : 'text-gray-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Profile Settings */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
                      <User className="h-6 w-6 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Personal Information</h3>
                      <p className="text-sm text-gray-400 mb-4">Update your personal details and fitness goals</p>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Fitness Goals
                          </label>
                          <div className="relative">
                            <Target className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                            <textarea 
                              value={formData.fitnessGoals}
                              onChange={(e) => setFormData({...formData, fitnessGoals: e.target.value})}
                              disabled={!isEditing}
                              rows="4"
                              placeholder="What are your fitness goals? (e.g., Build muscle, Lose weight, Train for a marathon...)"
                              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl">
                      <Award className="h-6 w-6 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Fitness Profile</h3>
                      <p className="text-sm text-gray-400 mb-4">Your fitness stats and achievements</p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Current Level</p>
                          <p className="text-2xl font-bold text-white">{user?.gamification?.level || 1}</p>
                        </div>
                        <div className="p-4 bg-slate-700/30 rounded-lg">
                          <p className="text-sm text-gray-400 mb-1">Total XP</p>
                          <p className="text-2xl font-bold text-white">{user?.gamification?.xp || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Health Metrics Settings */}
            {activeTab === 'metrics' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl">
                      <Activity className="h-6 w-6 text-cyan-400" />
                    </div>
                    <div className="flex-1 w-full">
                      <h3 className="text-lg font-semibold text-white mb-1">Health Metrics & Biometrics</h3>
                      <p className="text-sm text-gray-400 mb-6">These metrics are strictly used by the AI Coach to formulate precise protocols.</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Age</label>
                           <input type="number" min="13" max="120" value={formData.profileData.age} onChange={e => setFormData({...formData, profileData: {...formData.profileData, age: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Weight (kg)</label>
                           <input type="number" min="30" max="500" value={formData.profileData.weight} onChange={e => setFormData({...formData, profileData: {...formData.profileData, weight: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Height (cm)</label>
                           <input type="number" min="100" max="300" value={formData.profileData.height} onChange={e => setFormData({...formData, profileData: {...formData.profileData, height: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50" />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Sleep (Hours/Night)</label>
                           <input type="number" min="0" max="24" value={formData.profileData.sleepHours} onChange={e => setFormData({...formData, profileData: {...formData.profileData, sleepHours: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50" />
                        </div>
                        
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Primary Goal</label>
                           <select value={formData.profileData.goal} onChange={e => setFormData({...formData, profileData: {...formData.profileData, goal: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50">
                             <option value="">Select...</option>
                             <option value="Weight Loss">Weight Loss</option>
                             <option value="Muscle Gain">Muscle Gain</option>
                             <option value="Maintenance">Maintenance</option>
                             <option value="General Health">General Health</option>
                             <option value="Performance">Performance</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Activity Level</label>
                           <select value={formData.profileData.activityLevel} onChange={e => setFormData({...formData, profileData: {...formData.profileData, activityLevel: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50">
                             <option value="">Select...</option>
                             <option value="Sedentary">Sedentary</option>
                             <option value="Light">Light</option>
                             <option value="Moderate">Moderate</option>
                             <option value="Active">Active</option>
                             <option value="Very Active">Very Active</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Diet Preference</label>
                           <select value={formData.profileData.dietPreference} onChange={e => setFormData({...formData, profileData: {...formData.profileData, dietPreference: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50">
                             <option value="">Select...</option>
                             <option value="None">None</option>
                             <option value="Vegan">Vegan</option>
                             <option value="Vegetarian">Vegetarian</option>
                             <option value="Keto">Keto</option>
                             <option value="Paleo">Paleo</option>
                             <option value="Mediterranean">Mediterranean</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Stress Level</label>
                           <select value={formData.profileData.stressLevel} onChange={e => setFormData({...formData, profileData: {...formData.profileData, stressLevel: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50">
                             <option value="">Select...</option>
                             <option value="Low">Low</option>
                             <option value="Moderate">Moderate</option>
                             <option value="High">High</option>
                             <option value="Severe">Severe</option>
                           </select>
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Workout Experience</label>
                           <select value={formData.profileData.workoutExperience} onChange={e => setFormData({...formData, profileData: {...formData.profileData, workoutExperience: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50">
                             <option value="">Select...</option>
                             <option value="Beginner">Beginner</option>
                             <option value="Intermediate">Intermediate</option>
                             <option value="Advanced">Advanced</option>
                           </select>
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Medical Conditions / Injuries (Optional)</label>
                           <input type="text" value={formData.profileData.medicalConditions} onChange={e => setFormData({...formData, profileData: {...formData.profileData, medicalConditions: e.target.value}})} disabled={!isEditing} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 focus:border-accent outline-none disabled:opacity-50" placeholder="e.g. Asthma, Knee pain" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Preferences Settings */}
            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl">
                      <Globe className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Units & Measurements</h3>
                      <p className="text-sm text-gray-400 mb-4">Choose your preferred measurement system</p>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                          <input
                            type="radio"
                            name="units"
                            value="lbs"
                            checked={formData.preferences.units === 'lbs'}
                            onChange={(e) => setFormData({
                              ...formData,
                              preferences: { ...formData.preferences, units: e.target.value }
                            })}
                            disabled={!isEditing}
                            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white font-medium">LBS</span>
                          <span className="text-sm text-gray-400 ml-auto">Pounds (lbs)</span>
                        </label>
                        
                        <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                          <input
                            type="radio"
                            name="units"
                            value="kg"
                            checked={formData.preferences.units === 'kg'}
                            onChange={(e) => setFormData({
                              ...formData,
                              preferences: { ...formData.preferences, units: e.target.value }
                            })}
                            disabled={!isEditing}
                            className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-white font-medium">KG</span>
                          <span className="text-sm text-gray-400 ml-auto">Kilograms (kg)</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl">
                      <Bell className="h-6 w-6 text-yellow-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-1">Notifications</h3>
                      <p className="text-sm text-gray-400 mb-4">Manage your notification preferences</p>
                      
                      <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                        <input
                          type="checkbox"
                          checked={formData.preferences.notificationsEnabled}
                          onChange={(e) => setFormData({
                            ...formData,
                            preferences: { ...formData.preferences, notificationsEnabled: e.target.checked }
                          })}
                          disabled={!isEditing}
                          className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <span className="text-white font-medium">Enable Notifications</span>
                          <p className="text-sm text-gray-400">Receive updates about your workouts and achievements</p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-red-500/20 to-pink-500/20 rounded-xl">
                    <Shield className="h-6 w-6 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Account Security</h3>
                    <p className="text-sm text-gray-400 mb-4">Manage your account security settings</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Email Verification</p>
                          <p className="text-sm text-gray-400">
                            {user?.isVerified ? 'Your email is verified' : 'Verify your email address'}
                          </p>
                        </div>
                        {user?.isVerified ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-400 transition">
                            Verify Email
                          </button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-400">Add an extra layer of security</p>
                        </div>
                        <button className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-medium hover:bg-slate-500 transition">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 border border-red-500/30 p-8 rounded-2xl max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Delete Account</h2>
                  <p className="text-gray-400 text-sm">This action is irreversible</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-gray-300">
                  This will permanently delete your account and all associated data including:
                </p>
                <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                  <li>Workout history and progress</li>
                  <li>Nutrition logs and meal plans</li>
                  <li>Personal records and achievements</li>
                  <li>Account settings and preferences</li>
                </ul>
                
                <div className="bg-slate-700/50 p-4 rounded-lg">
                  <p className="text-gray-300 text-sm mb-2">
                    Please type <span className="font-mono font-bold text-red-400">DELETE</span> to confirm:
                  </p>
                  <input 
                    type="text" 
                    value={deleteInput}
                    onChange={(e) => setDeleteInput(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full bg-slate-900 border border-slate-600 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-red-500 transition-colors"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteInput('');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-700 text-white hover:bg-slate-600 transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteAccount} 
                  disabled={deleteInput !== 'DELETE'}
                  className="flex-1 px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;