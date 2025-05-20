import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { USER_API_END_POINT } from '@/utils/constant';
import { setUser } from '@/Redux/authSlice';
import Navbar from './shared/Navbar';
import { 
  Bell, 
  Lock, 
  User, 
  LogOut, 
  Mail, 
  Phone, 
  Shield, 
  Save,
  Loader2
} from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';

const Settings = () => {
  const { user } = useSelector((store) => store.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    browserNotifications: true
  });

  // Add password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Add password validation function
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];
    if (password.length < minLength) errors.push(`At least ${minLength} characters`);
    if (!hasUpperCase) errors.push('One uppercase letter');
    if (!hasLowerCase) errors.push('One lowercase letter');
    if (!hasNumbers) errors.push('One number');
    if (!hasSpecialChar) errors.push('One special character');

    return errors;
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear previous errors
    setPasswordErrors(prev => ({
      ...prev,
      [name]: ''
    }));

    // Validate new password
    if (name === 'newPassword') {
      const errors = validatePassword(value);
      if (errors.length > 0) {
        setPasswordErrors(prev => ({
          ...prev,
          newPassword: errors.join(', ')
        }));
      }
    }

    // Check if passwords match
    if (name === 'confirmPassword' || name === 'newPassword') {
      if (name === 'confirmPassword' && value !== formData.newPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      } else if (name === 'newPassword' && value !== formData.confirmPassword && formData.confirmPassword) {
        setPasswordErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
      }
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    setFormData({
      ...formData,
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      emailNotifications: user.notificationPreferences?.emailNotifications ?? true,
      browserNotifications: user.notificationPreferences?.browserNotifications ?? true
    });
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSwitchChange = (name) => {
    setFormData({
      ...formData,
      [name]: !formData[name]
    });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${USER_API_END_POINT}/update-profile`,
        {
          email: formData.email,
          phoneNumber: formData.phoneNumber
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (res.data.success) {
        dispatch(setUser(res.data.user));
        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    
    // Validate current password
    if (!formData.currentPassword.trim()) {
      setPasswordErrors(prev => ({
        ...prev,
        currentPassword: 'Current password is required'
      }));
      return;
    }

    // Validate new password
    const newPasswordErrors = validatePassword(formData.newPassword);
    if (newPasswordErrors.length > 0) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: newPasswordErrors.join(', ')
      }));
      return;
    }

    // Check if passwords match
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        confirmPassword: 'Passwords do not match'
      }));
      return;
    }

    // Check if new password is same as current password
    if (formData.currentPassword === formData.newPassword) {
      setPasswordErrors(prev => ({
        ...prev,
        newPassword: 'New password must be different from current password'
      }));
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/update-password`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        },
        { 
          withCredentials: true,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (res.data.success) {
        toast.success('Password updated successfully');
        // Clear form data
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }));
        // Clear any errors
        setPasswordErrors({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error(error);
      if (error.response?.data?.message === 'Current password is incorrect') {
        setPasswordErrors(prev => ({
          ...prev,
          currentPassword: 'Current password is incorrect'
        }));
      } else {
        toast.error(error.response?.data?.message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async () => {
    setLoading(true);

    try {
      const res = await axios.post(
        `${USER_API_END_POINT}/update-notification-preferences`,
        {
          emailNotifications: formData.emailNotifications,
          browserNotifications: formData.browserNotifications
        },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (res.data.success) {
        const updatedUser = {
          ...user,
          notificationPreferences: res.data.notificationPreferences
        };
        dispatch(setUser(updatedUser));
        toast.success('Notification settings updated');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const logOutHandler = async () => {
    try {
      const res = await axios.get(`${USER_API_END_POINT}/logout`, { withCredentials: true });
      if (res.data.success) {
        dispatch(setUser(null));
        localStorage.removeItem('user');
        navigate("/login");
        window.location.reload();
        toast.success(res.data.message);
      }
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || 'Logout failed');
    }
  };

  if (!user) {
    return null; // Or a loading spinner
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">Account Settings</h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <User size={18} />
                <span>Profile Information</span>
              </button>
              
              <button
                onClick={() => setActiveTab('security')}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeTab === 'security' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Lock size={18} />
                <span>Security</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full text-left px-4 py-2 rounded-md flex items-center gap-2 ${
                  activeTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <Bell size={18} />
                <span>Notifications</span>
              </button>
              
              
              <hr className="my-2" />
              
              <button
                onClick={logOutHandler}
                className="w-full text-left px-4 py-2 rounded-md text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut size={18} />
                <span>Log Out</span>
              </button>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
            {activeTab === 'profile' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                <form onSubmit={updateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullname">Full Name</Label>
                    <Input
                      id="fullname"
                      value={user.fullname || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      To change your name, please update it from your profile page.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail size={18} className="text-gray-400" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <div className="flex items-center gap-2">
                      <Phone size={18} className="text-gray-400" />
                      <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  
                  <Button type="submit" disabled={loading} className="mt-2">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
            
            {activeTab === 'security' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
                <form onSubmit={updatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                      required
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.newPassword ? 'border-red-500' : ''}
                      required
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Password must contain at least 8 characters, one uppercase letter, one lowercase letter, 
                      one number, and one special character.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handlePasswordChange}
                      className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                      required
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{passwordErrors.confirmPassword}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={loading || Object.values(passwordErrors).some(error => error) || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
                    className="mt-4 w-full md:w-auto"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating Password...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-4 w-4" />
                        Update Password
                      </>
                    )}
                  </Button>
                </form>
              </div>
            )}
            
            {activeTab === 'notifications' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Email Notifications</h3>
                      <p className="text-sm text-gray-500">Receive job alerts and updates via email</p>
                    </div>
                    <Switch
                      checked={formData.emailNotifications}
                      onCheckedChange={() => handleSwitchChange('emailNotifications')}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Browser Notifications</h3>
                      <p className="text-sm text-gray-500">Receive notifications in your browser</p>
                    </div>
                    <Switch
                      checked={formData.browserNotifications}
                      onCheckedChange={() => handleSwitchChange('browserNotifications')}
                    />
                  </div>
                  
                  <Button onClick={updateNotificationSettings} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Preferences"
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;

