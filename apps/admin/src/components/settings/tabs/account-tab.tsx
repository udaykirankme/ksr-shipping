import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const API_BASE = 'http://localhost:5000/api/admin';

export default function AccountTab() {
  const [profile, setProfile] = useState({ full_name: "", username: "", email: "", mobile_number: "" });
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [usernames, setUsernames] = useState({ currentUsername: "", newUsername: "", confirmUsername: "" });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/account/me`, { credentials: 'include' });
      if (!res.ok) throw new Error("Unable to load your profile at this time.");
      const data = await res.json();
      setProfile({
        full_name: data.data?.full_name || "",
        username: data.data?.username || "",
        email: data.data?.email || "",
        mobile_number: data.data?.mobile_number || ""
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/account/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profile)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unable to update your profile. Please check your inputs.");
      }
      toast.success("Profile updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    try {
      const res = await fetch(`${API_BASE}/account/password-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unable to change your password. Verify your current password and try again.");
      }
      toast.success("Password updated successfully");
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernames.newUsername !== usernames.confirmUsername) {
      return toast.error("New usernames do not match");
    }
    if (usernames.newUsername.length < 4 || usernames.newUsername.length > 30) {
      return toast.error("Username must be between 4 and 30 characters");
    }
    if (!/^[a-zA-Z0-9_\.]+$/.test(usernames.newUsername)) {
      return toast.error("Username can only contain letters, numbers, underscores, and dots");
    }
    try {
      const res = await fetch(`${API_BASE}/account/username-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(usernames)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unable to change your username.");
      }
      toast.success("Username updated successfully. Your new username will now be used for all future logins.");
      setUsernames({ currentUsername: "", newUsername: "", confirmUsername: "" });
      setProfile(prev => ({ ...prev, username: usernames.newUsername }));
      // Optional: dispatch event if header listens for it
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="space-y-10">
      
      {/* Profile Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Update Profile</h2>
          <p className="text-sm text-gray-700">Manage your administrative account details.</p>
        </div>
        <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input 
                type="text" 
                value={profile.full_name} 
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                value={profile.email} 
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number</label>
              <input 
                type="text" 
                value={profile.mobile_number} 
                onChange={(e) => setProfile({ ...profile, mobile_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <Button type="submit">Update Profile</Button>
          </div>
        </form>
      </section>

      <hr className="border-gray-200" />

      {/* Password Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-700">Update your account password. You must verify your current password.</p>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input 
              required
              type="password" 
              value={passwords.currentPassword} 
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input 
                required
                type="password" 
                value={passwords.newPassword} 
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input 
                required
                type="password" 
                value={passwords.confirmPassword} 
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <Button type="submit">Change Password</Button>
          </div>
        </form>
      </section>

      <hr className="border-gray-200" />

      {/* Username Section */}
      <section>
        <div className="mb-4">
          <h2 className="text-lg font-medium text-gray-900">Change Username</h2>
          <p className="text-sm text-gray-700">Update the username used to sign in to the admin panel.</p>
        </div>
        <form onSubmit={handleChangeUsername} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Username *</label>
            <input 
              required
              type="text" 
              value={usernames.currentUsername} 
              onChange={(e) => setUsernames({ ...usernames, currentUsername: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Username *</label>
              <input 
                required
                type="text" 
                value={usernames.newUsername} 
                onChange={(e) => setUsernames({ ...usernames, newUsername: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Username *</label>
              <input 
                required
                type="text" 
                value={usernames.confirmUsername} 
                onChange={(e) => setUsernames({ ...usernames, confirmUsername: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <Button type="submit">Update Username</Button>
          </div>
        </form>
      </section>

    </div>
  );
}
