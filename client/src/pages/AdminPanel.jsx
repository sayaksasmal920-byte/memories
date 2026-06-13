import React, { useState, useEffect } from "react";
import { Key, RotateCcw, Lock, Unlock, Check, AlertTriangle, UserPlus, Copy, ExternalLink } from "lucide-react";
import { API_BASE } from "../context/AuthContext";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Invite generation state
  const [adminSecret, setAdminSecret] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch all active invite tokens (users)
  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError("Failed to fetch user list.");
      }
    } catch (err) {
      setError("Failed to connect to backend server.");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleGenerateInvite = async (e) => {
    e.preventDefault();
    if (!adminSecret) {
      setInviteError("Admin secret is required to generate an invite.");
      return;
    }
    setInviteLoading(true);
    setInviteError("");
    setGeneratedInvite(null);
    setCopied(false);

    try {
      const res = await fetch(`${API_BASE}/api/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": adminSecret,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok) {
        // Build a client-side invite URL using the current hostname
        const clientBase = window.location.origin;
        setGeneratedInvite({
          ...data.user,
          inviteUrl: `${clientBase}/u/${data.user.inviteToken}`,
        });
        fetchUsers(); // Refresh user list
      } else if (res.status === 403) {
        setInviteError("Incorrect admin secret. Check your ADMIN_SECRET in server .env.");
      } else {
        setInviteError(data.error || "Failed to generate invite.");
      }
    } catch (err) {
      setInviteError("Connection error. Is the backend server running?");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCopyInvite = () => {
    if (!generatedInvite) return;
    const text = `Invite Token: ${generatedInvite.inviteToken}\nDefault Password: ${generatedInvite.defaultPassword}\nLogin URL: ${generatedInvite.inviteUrl}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleVerifyCurrentPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !currentPassword) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          currentPassword,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsUnlocked(true);
        setSuccess("Current password verified successfully. Portal unlocked.");
      } else {
        setError(data.error || "Incorrect password.");
      }
    } catch (err) {
      setError("Connection error verifying password.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = async () => {
    if (!selectedUserId || !currentPassword) return;
    const selectedUser = users.find(u => u.id === selectedUserId);
    if (!window.confirm(`Are you sure you want to reset the password for token "${selectedUser?.inviteToken}" back to the default "memory123"?`)) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          currentPassword,
          defaultPassword: "memory123",
          mustChangePassword: true,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Password for invite token "${selectedUser?.inviteToken}" has been reset to "memory123".`);
        // Lock page again
        setIsUnlocked(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchUsers(); // Refresh list to update badge states
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (err) {
      setError("Connection error resetting password.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !currentPassword) {
      setError("Please select an invite token and unlock the portal first.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const selectedUser = users.find(u => u.id === selectedUserId);
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/users/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUserId,
          currentPassword,
          newPassword: newPassword,
          mustChangePassword: false, // User chose this password, no need to change on next login
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(`Password for "${selectedUser?.inviteToken}" has been updated successfully!`);
        // Lock page again
        setIsUnlocked(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        fetchUsers(); // Refresh list to update badge states
      } else {
        setError(data.error || "Failed to update password.");
      }
    } catch (err) {
      setError("Connection error updating password.");
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  return (
    <div className="min-h-screen bg-[#FAF3E0] dot-grid text-[#1E293B] p-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-6">
        
        {/* Header Block */}
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[5px_5px_0px_0px_rgba(30,41,59,1)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#8B5CF6] border-2 border-[#1E293B] flex items-center justify-center shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)]">
            <Key size={22} color="white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="font-display font-black text-xl uppercase tracking-wider leading-tight">
              Memories Portal
            </h2>
            <p className="text-[10px] font-extrabold uppercase text-[#5C6F84]">
              Generate invite tokens & manage passwords for our memories
            </p>
          </div>
        </div>

        {/* ── Generate New Invite Card ── */}
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] space-y-4">
          <div className="flex items-center gap-2 border-b-2 border-[#1E293B] pb-3">
            <div className="w-8 h-8 rounded-full bg-[#EC4899] border-2 border-[#1E293B] flex items-center justify-center shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
              <UserPlus size={14} color="white" strokeWidth={2.5} />
            </div>
            <h3 className="font-display font-black text-sm uppercase tracking-wider">Generate New Invite</h3>
          </div>

          {inviteError && (
            <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={14} /> {inviteError}
            </div>
          )}

          <form onSubmit={handleGenerateInvite} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              <label className="text-[9px] font-black uppercase text-[#5C6F84] block">Admin Secret</label>
              <input
                type="password"
                placeholder="Enter admin secret key..."
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
                className="w-full input-field text-xs py-2.5 font-bold"
                required
              />
            </div>
            <button
              type="submit"
              disabled={inviteLoading}
              className="btn-primary text-xs uppercase py-2.5 px-4 shadow-[2.5px_2.5px_0px_0px_rgba(30,41,59,1)] cursor-pointer flex items-center gap-2 shrink-0"
            >
              <UserPlus size={13} />
              {inviteLoading ? "Generating..." : "Generate Invite"}
            </button>
          </form>

          {/* Generated invite result */}
          {generatedInvite && (
            <div className="bg-[#FAF3E0] border-2 border-[#10B981] rounded-xl p-4 space-y-3 animate-fade-in shadow-[2px_2px_0px_0px_rgba(16,185,129,1)]">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-[#047857]" />
                <span className="text-xs font-black uppercase text-[#047857]">New Invite Created Successfully!</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border-2 border-[#1E293B] rounded-lg p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                  <div className="text-[8px] font-black uppercase text-[#5C6F84] mb-1">Invite Token</div>
                  <div className="font-display font-black text-lg text-[#8B5CF6]">{generatedInvite.inviteToken}</div>
                </div>
                <div className="bg-white border-2 border-[#1E293B] rounded-lg p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                  <div className="text-[8px] font-black uppercase text-[#5C6F84] mb-1">Default Password</div>
                  <div className="font-display font-black text-lg text-[#EC4899]">{generatedInvite.defaultPassword}</div>
                </div>
              </div>

              <div className="bg-white border-2 border-[#1E293B] rounded-lg p-2.5 shadow-[1.5px_1.5px_0px_0px_rgba(30,41,59,1)]">
                <div className="text-[8px] font-black uppercase text-[#5C6F84] mb-1">Shareable Login URL</div>
                <div className="text-xs font-bold text-[#1E293B] break-all font-mono">{generatedInvite.inviteUrl}</div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyInvite}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs uppercase font-black border-2 border-[#1E293B] rounded-lg shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer transition-colors ${
                    copied ? "bg-[#10B981] text-white border-[#10B981]" : "bg-white hover:bg-[#FAF3E0]"
                  }`}
                >
                  {copied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Invite Details</>}
                </button>
                <a
                  href={generatedInvite.inviteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 text-xs uppercase font-black border-2 border-[#1E293B] rounded-lg bg-[#8B5CF6] text-white shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer hover:bg-[#7C3AED] no-underline"
                >
                  <ExternalLink size={13} /> Open
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Card */}
        <div className="bg-[#FFFDF9] border-3 border-[#1E293B] rounded-xl p-6 shadow-[6px_6px_0px_0px_rgba(30,41,59,1)] space-y-6">
          
          {/* Notifications */}
          {error && (
            <div className="bg-[#F87171] bg-opacity-20 border-2 border-[#F87171] text-[#B91C1C] rounded-lg p-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {success && (
            <div className="bg-[#10B981] bg-opacity-20 border-2 border-[#10B981] text-[#047857] rounded-lg p-3 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <Check size={16} /> {success}
            </div>
          )}

          {/* Select User Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#5C6F84]">
              Step 1: Select Your Invite Token
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => {
                setSelectedUserId(e.target.value);
                setIsUnlocked(false);
                setCurrentPassword("");
                setError("");
                setSuccess("");
                setNewPassword("");
                setConfirmPassword("");
              }}
              className="w-full input-field select-all bg-[#FAF3E0] font-bold text-center cursor-pointer py-3"
            >
              <option value="">-- Choose invite token --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  /u/{u.inviteToken} {u.mustChangePassword ? "🔑 (Default password)" : "✅ (Custom password)"}
                </option>
              ))}
            </select>
          </div>

          {/* Verification Step (If selected and not unlocked) */}
          {selectedUserId && !isUnlocked && (
            <form onSubmit={handleVerifyCurrentPassword} className="space-y-4 pt-4 border-t-2 border-[#1E293B] border-dashed animate-fade-in">
              <div className="text-center font-display font-black text-xs uppercase tracking-wider text-[#5C6F84]">
                🔐 Unlock password actions for: <span className="text-[#8B5CF6]">/u/{selectedUser?.inviteToken}</span>
              </div>
              
              <div className="space-y-2 max-w-sm mx-auto">
                <input
                  type="password"
                  placeholder="Enter Current Password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full input-field text-center py-2.5 text-xs font-bold"
                  required
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-xs uppercase text-white"
                >
                  <Lock size={14} />
                  {loading ? "Checking..." : "Verify & Unlock"}
                </button>
              </div>
            </form>
          )}

          {/* Actions when User Selected and Unlocked */}
          {selectedUserId && isUnlocked && (
            <div className="space-y-6 pt-4 border-t-2 border-[#1E293B] border-dashed animate-fade-in">
              <div className="text-center font-display font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 text-[#047857]">
                <Unlock size={18} />
                Unlocked Portal for: <span className="text-[#8B5CF6]">/u/{selectedUser?.inviteToken}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Reset to Default Card */}
                <div className="bg-[#FAF3E0] border-2 border-[#1E293B] rounded-xl p-4 flex flex-col justify-between shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]">
                  <div>
                    <h4 className="font-display font-black text-xs uppercase tracking-wider text-[#1E293B] flex items-center gap-2 mb-2">
                      <RotateCcw size={14} />
                      Reset to Default
                    </h4>
                    <p className="text-[10.5px] text-[#5C6F84] leading-relaxed mb-4">
                      Reverts the password of this invite token back to the standard default password: <code className="bg-white px-1.5 py-0.5 rounded border border-[#1E293B] font-bold text-[#1E293B]">memory123</code>.
                    </p>
                  </div>
                  <button
                    onClick={handleResetToDefault}
                    disabled={loading}
                    className="w-full btn-secondary text-xs uppercase py-2.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>

                {/* Change Custom Password Card */}
                <form
                  onSubmit={handleChangePassword}
                  className="bg-[#FAF3E0] border-2 border-[#1E293B] rounded-xl p-4 space-y-3 shadow-[3px_3px_0px_0px_rgba(30,41,59,1)]"
                >
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-[#1E293B] flex items-center gap-2">
                    <Key size={14} />
                    Set Custom Password
                  </h4>
                  
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full input-field text-xs bg-white py-2"
                      disabled={loading}
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <input
                      type="password"
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full input-field text-xs bg-white py-2"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary text-xs uppercase py-2.5 shadow-[2px_2px_0px_0px_rgba(30,41,59,1)] cursor-pointer text-white"
                  >
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>

              </div>
            </div>
          )}

        </div>

        {/* Footer Return Home */}
        <div className="text-center">
          <a
            href="/"
            className="text-xs font-bold uppercase text-[#5C6F84] hover:text-[#8B5CF6] transition-colors duration-200 no-underline"
          >
            ← Return to Landing Page
          </a>
        </div>

      </div>
    </div>
  );
}
