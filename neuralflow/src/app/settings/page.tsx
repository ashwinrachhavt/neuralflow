"use client";

import { useState } from "react";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { DynamicBackground } from "@/components/effects/DynamicBackground";
import { RepositoryStatus } from "@/components/debug/RepositoryStatus";
import { Bell, Clock, Palette, Download, Trash2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [pomodoroLength, setPomodoroLength] = useState(25);
  const [shortBreak, setShortBreak] = useState(5);
  const [longBreak, setLongBreak] = useState(15);
  const [theme, setTheme] = useState('dark');



  const handleExportData = () => {
    // TODO: Implement data export
    alert('Data export feature coming soon!');
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      // TODO: Implement data clearing
      alert('Data clearing feature coming soon!');
    }
  };

  const handleResetSettings = () => {
    if (confirm('Reset all settings to default values?')) {
      setNotifications(true);
      setPomodoroLength(25);
      setShortBreak(5);
      setLongBreak(15);
      setTheme('dark');
    }
  };

  return (
    <div className="min-h-svh">
      <Navbar />
      
      <SignedOut>
        <DynamicBackground useUnicornStudio={true} />
        <div className="relative min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 z-10">
          <div className="text-center max-w-md">
            <h1 className="text-4xl font-bold tracking-tight mb-4 text-foreground drop-shadow-lg">
              Neural Flow
            </h1>
            <p className="text-gray-300 mb-8 text-lg drop-shadow-md">
              Sign in to access settings
            </p>
            <SignInButton mode="modal">
              <button className="bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 text-foreground font-medium py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <main className="container mx-auto py-8 px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="mt-2 text-muted-foreground">Customize your Neural Flow experience</p>
          </div>

          <div className="space-y-6">
            {/* Pomodoro Settings */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Clock className="h-5 w-5 text-primary" />
                  Pomodoro Timer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Focus Duration
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="15"
                        max="60"
                        step="5"
                        value={pomodoroLength}
                        onChange={(e) => setPomodoroLength(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                      />
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {pomodoroLength}m
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Short Break
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="3"
                        max="15"
                        step="1"
                        value={shortBreak}
                        onChange={(e) => setShortBreak(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {shortBreak}m
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Long Break
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="10"
                        max="30"
                        step="5"
                        value={longBreak}
                        onChange={(e) => setLongBreak(Number(e.target.value))}
                        className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-foreground w-12 text-right">
                        {longBreak}m
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-muted-foreground">
                    Changes will apply to new timer sessions. Current session settings remain unchanged.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Bell className="h-5 w-5 text-yellow-400" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-foreground">Browser Notifications</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Get notified when pomodoro sessions end
                    </div>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notifications ? 'bg-blue-600' : 'bg-slate-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Theme */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Palette className="h-5 w-5 text-purple-400" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-3">
                    Theme
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setTheme('dark')}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === 'dark'
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <div className="text-sm font-medium">Dark</div>
                      <div className="text-xs opacity-70 mt-1">Current theme</div>
                    </button>
                    <button
                      onClick={() => setTheme('light')}
                      className={`p-3 rounded-lg border transition-all ${
                        theme === 'light'
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-muted-foreground'
                      }`}
                    >
                      <div className="text-sm font-medium">Light</div>
                      <div className="text-xs opacity-70 mt-1">Clean & bright</div>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Storage Backend Status */}
            <RepositoryStatus />

            {/* Data Management */}
            <Card className="border-border bg-card/50 backdrop-blur-sm shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Download className="h-5 w-5 text-primary" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-slate-600/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Export Data</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Download your tasks and analytics data
                    </div>
                  </div>
                  <Button
                    onClick={handleExportData}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 text-muted-foreground hover:bg-muted/50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-slate-600/30">
                  <div>
                    <div className="text-sm font-medium text-foreground">Clear All Data</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Remove all tasks, analytics, and settings
                    </div>
                  </div>
                  <Button
                    onClick={handleClearData}
                    variant="outline"
                    size="sm"
                    className="border-red-600/50 text-red-400 hover:bg-red-600/10"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleResetSettings}
                variant="outline"
                className="border-slate-600 text-muted-foreground hover:bg-muted/50"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
          </div>
        </main>
      </SignedIn>
    </div>
  );
}
