/**
 * Settings Page
 * 
 * User can:
 * - Update profile (name, email)
 * - Change password
 * - Delete account (GDPR compliant)
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DarkLayout } from "../components/DarkLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { User, Lock, Trash2, AlertTriangle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

interface UserData {
  name: string;
  email: string;
}

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Profile state
  const [profile, setProfile] = useState<UserData>({ name: "", email: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  
  // Delete account state
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Load user data on mount
  useState(() => {
    const loadUser = async () => {
      try {
        const response = await apiRequest("/api/auth/me");
        if (response.user) {
          setProfile({
            name: response.user.name || "",
            email: response.user.email || "",
          });
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      }
    };
    loadUser();
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);

    try {
      await apiRequest("/api/user/profile", {
        method: "PUT",
        body: JSON.stringify(profile),
      });
      
      setProfileSuccess(true);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
      
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordLoading(true);

    try {
      await apiRequest("/api/user/password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
      });
      
      // Clear form
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE MY ACCOUNT") {
      toast({
        title: "Confirmation required",
        description: "Please type 'DELETE MY ACCOUNT' to confirm",
        variant: "destructive",
      });
      return;
    }

    setDeleteLoading(true);

    try {
      await apiRequest("/api/user/account", {
        method: "DELETE",
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });
      
      // Clear local storage and redirect
      localStorage.removeItem("token");
      toast({
        title: "Account deleted",
        description: "Your account has been permanently deleted.",
      });
      
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Deletion failed",
        description: error.message || "Failed to delete account",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <DarkLayout>
      <div className="space-y-6 max-w-2xl mx-auto py-8 px-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-2">Manage your account settings and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              <CardTitle className="text-white">Profile</CardTitle>
            </div>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your name"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="you@example.com"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <Button 
                type="submit" 
                disabled={profileLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {profileLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : profileSuccess ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : null}
                {profileSuccess ? "Saved!" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              <CardTitle className="text-white">Change Password</CardTitle>
            </div>
            <CardDescription>Update your account password</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <Alert variant="destructive">
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
                <p className="text-xs text-gray-500">
                  At least 8 characters, with uppercase, lowercase, and a number
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <Button 
                type="submit" 
                disabled={passwordLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {passwordLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="bg-gray-800" />

        {/* Danger Zone */}
        <Card className="bg-gray-900 border-red-900/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <CardTitle className="text-red-400">Danger Zone</CardTitle>
            </div>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="bg-red-900/20 border-red-900/50 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-200">
                Deleting your account is permanent. All your data, including metrics history,
                will be permanently removed. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-800">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Your Account?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    This action is permanent and cannot be undone. All your data will be deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="deletePassword">Enter your password</Label>
                    <Input
                      id="deletePassword"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="deleteConfirmation">
                      Type <span className="font-mono text-red-400">DELETE MY ACCOUNT</span> to confirm
                    </Label>
                    <Input
                      id="deleteConfirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deleteLoading || deleteConfirmation !== "DELETE MY ACCOUNT"}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DarkLayout>
  );
}
