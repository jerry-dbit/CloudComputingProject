'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { Card, Button, Input, Avatar } from '@/components/ui';
import { User, Save, Cloud, Database, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { getDisplayName, getInitials } from '@/lib/auth';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const { theme, toggleTheme } = useTheme();
  const displayName = getDisplayName(user);
  const initials = getInitials(user);

  useEffect(() => {
    if (!user) return;

    setUsername(user.username);
    setEmail(user.email || '');
    setFirstName(user.firstName);
    setLastName(user.lastName);
  }, [user]);

  const handleSave = () => {
    setError('');
    const result = updateProfile({ username, email, firstName, lastName });
    if ('error' in result) {
      setError(result.error || 'Failed to update profile.');
      return;
    }

    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage your account and preferences for {displayName}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h2>
        
        <div className="flex items-center gap-6 mb-6">
          <Avatar fallback={initials} size="lg" />
          <div>
            <Button variant="outline" size="sm">Change Avatar</Button>
            <p className="text-xs text-[var(--text-secondary)] mt-2">Profile data is stored locally for this demo session.</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
          />
          <Input
            label="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
          />
        </div>

        <Button onClick={handleSave} className="mt-6 gap-2">
          <Save className="w-4 h-4" />
          {saved ? 'Saved!' : 'Save Changes'}
        </Button>

        {error && <p className="mt-3 text-sm text-[var(--danger)]">{error}</p>}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          Appearance
        </h2>
        
        <div className="flex items-center justify-between p-4 bg-[var(--surface-dark)] rounded-lg">
          <div>
            <p className="font-medium text-[var(--text-primary)]">Dark Mode</p>
            <p className="text-sm text-[var(--text-secondary)]">Toggle between light and dark theme</p>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full relative transition-all ${
              theme === 'dark' ? 'bg-[var(--primary)]' : 'bg-[var(--surface-dark)]'
            }`}
          >
            <span className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow ${
              theme === 'dark' ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <Cloud className="w-5 h-5" />
          Azure Configuration
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Azure Storage Connection String
            </label>
            <Input
              type="password"
              placeholder="DefaultConnection..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Azure Cosmos DB Endpoint
            </label>
            <Input
              placeholder="https://*.documents.azure.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
              Azure Cosmos DB Key
            </label>
            <Input
              type="password"
              placeholder="Your API key..."
            />
          </div>
        </div>

        <Button className="mt-6 gap-2">
          <Database className="w-4 h-4" />
          Test Connection
        </Button>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5" />
          Preferences
        </h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-[var(--surface-dark)] rounded-lg">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Email Notifications</p>
              <p className="text-sm text-[var(--text-secondary)]">Receive email updates about your study rooms</p>
            </div>
            <button className="w-12 h-6 bg-[var(--primary)] rounded-full relative transition-colors">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[var(--surface-dark)] rounded-lg">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Real-time Cursors</p>
              <p className="text-sm text-[var(--text-secondary)]">Show other users&apos; cursors in collaborative mode</p>
            </div>
            <button className="w-12 h-6 bg-[var(--primary)] rounded-full relative transition-colors">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-[var(--surface-dark)] rounded-lg">
            <div>
              <p className="font-medium text-[var(--text-primary)]">Auto-save Highlights</p>
              <p className="text-sm text-[var(--text-secondary)]">Automatically save highlights to cloud</p>
            </div>
            <button className="w-12 h-6 bg-[var(--surface-dark)] rounded-full relative transition-colors">
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}