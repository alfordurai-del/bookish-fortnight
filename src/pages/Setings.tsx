import { useState } from "react";
import { ArrowLeft } from 'lucide-react';
import { useLocation } from "wouter";
import {
  User, Bell, Globe, Moon, Info, FileText, Lock,
  Shield, CreditCard, LogOut, ChevronRight, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Import the useUser hook
import { useUser } from '../context/UserContext';


const SettingsPage = () => {
  // Access user data from the context
  const { user, isLoading: isUserLoading, error: userError } = useUser();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [, setLocation] = useLocation();

  // No longer needed as we use user from context
  // const userData = {
  //   name: "Alex Johnson",
  //   email: "alex.j@example.com",
  //   joined: "Jan 15, 2023"
  // };

  const settingsSections = [
    {
      title: "Account",
      items: [
        {icon: <User size={18} />, title: "Profile", action: "Edit"},
        {icon: <Shield size={18} />, title: "Security", action: "Manage"},
        {icon: <CreditCard size={18} />, title: "Payment Methods", action: "Configure"}
      ]
    },
    {
      title: "Preferences",
      items: [
        {
          icon: <Bell size={18} />,
          title: "Notifications",
          component: (
            <div
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className="relative inline-flex items-center cursor-pointer"
            >
              <div className={`w-11 h-6 rounded-full transition-colors ${
                notificationsEnabled ? 'bg-green-500' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full h-5 w-5 transition-transform ${
                  notificationsEnabled ? 'transform translate-x-5' : ''
                }`}></div>
              </div>
            </div>
          )
        },
        {
          icon: <Globe size={18} />,
          title: "Language",
          value: "English",
          action: "Change"
        },
        {
          icon: <Moon size={18} />,
          title: "Dark Mode",
          component: (
            <div
              onClick={() => setDarkModeEnabled(!darkModeEnabled)}
              className="relative inline-flex items-center cursor-pointer"
            >
              <div className={`w-11 h-6 rounded-full transition-colors ${
                darkModeEnabled ? 'bg-blue-500' : 'bg-gray-600'
              }`}>
                <div className={`absolute top-0.5 left-0.5 bg-white border rounded-full h-5 w-5 transition-transform ${
                  darkModeEnabled ? 'transform translate-x-5' : ''
                }`}></div>
              </div>
            </div>
          )
        }
      ]
    },
    {
      title: "About",
      items: [
        {icon: <Info size={18} />, title: "Version", value: "1.0.2"},
        {icon: <FileText size={18} />, title: "Terms of Service"},
        {icon: <Lock size={18} />, title: "Privacy Policy"}
      ]
    }
  ];

  // Conditional rendering based on user loading/error state
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex items-center justify-center">
        Loading user settings...
      </div>
    );
  }

  if (userError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-red-400 flex items-center justify-center">
        Error loading user data: {userError}
      </div>
    );
  }

  // If user is null (e.g., not logged in), redirect or show a message
  if (!user) {
      return (
          <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-400 flex items-center justify-center">
              Please log in to view settings.
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
           {/* Back Arrow */}
        <button
          onClick={() => setLocation('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm">Back</span>
        </button>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Settings
          </h1>
          <p className="text-gray-400 mt-2">Manage your account preferences</p>
        </header>

        {/* User Profile Card */}
        <div className="bg-gray-800/50 rounded-xl p-5 mb-8 border border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center">
              {/* Use user?.name to safely access the name */}
              <span className="text-2xl font-bold">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              {/* Use user?.name and user?.email */}
              <h2 className="text-xl font-bold">{user?.name}</h2>
              <p className="text-gray-400">{user?.email}</p>
              {/* Removed "Member since" as user object from context doesn't have a 'joined' field */}
              {/* <p className="text-gray-500 text-sm mt-1">Member since {userData.joined}</p> */}
            </div>
          </div>
          <Button className="w-full bg-gray-700 hover:bg-gray-600">
            Edit Profile
          </Button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {settingsSections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-bold">{section.title}</h2>
              </div>

              <div className="divide-y divide-gray-700">
                {section.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="p-4 flex items-center justify-between hover:bg-gray-700/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-gray-400">
                        {item.icon}
                      </div>
                      <span>{item.title}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-400">
                      {item.value && <span>{item.value}</span>}
                      {item.action && <span className="text-blue-400">{item.action}</span>}
                      {item.component}
                      {!item.component && !item.value && !item.action && <ChevronRight size={18} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Logout Section */}
        <div className="mt-8 bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
          <div
            className="p-4 flex items-center justify-between text-red-400 hover:bg-red-900/20 cursor-pointer transition-colors"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <div className="flex items-center gap-3">
              <LogOut size={18} />
              <span>Log Out</span>
            </div>
            <ChevronRight size={18} />
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full mx-4">
            <div className="flex justify-center mb-4">
              <div className="bg-red-500/20 p-3 rounded-full">
                <LogOut className="text-red-400" size={24} />
              </div>
            </div>

            <h3 className="text-xl font-bold text-center mb-2">Log Out?</h3>
            <p className="text-gray-400 text-center mb-6">
              Are you sure you want to log out of your account?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="border-gray-600 hover:bg-gray-700 text-black"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-gradient-to-r from-red-600 to-red-700 hover:opacity-90"
                onClick={() => window.location.assign("../")}
              >
                Log Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;