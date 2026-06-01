import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import Login from './Login';
import Dashboard from './Dashboard';
import AgentQueue from './AgentQueue';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userEmail = currentUser.email?.toLowerCase() || '';

        // 👑 THE FOUNDER'S KEY: Updated to email@edivy.in
        if (userEmail === 'email@edivy.in') {
          setUserRole('Admin');
          setLoading(false);
          return; // Stop checking, let the founder in!
        }

        // 🛡️ TYPO-PROOF AGENT CHECK: Ignore uppercase/lowercase mistakes
        const querySnapshot = await getDocs(collection(db, 'team'));
        const teamMembers = querySnapshot.docs.map((doc) => doc.data());

        // Find the user by comparing lowercase emails
        const matchedUser = teamMembers.find(
          (member) => (member.email || '').toLowerCase() === userEmail
        );

        if (matchedUser) {
          setUserRole(matchedUser.role);
        } else {
          setUserRole('Unauthorized');
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center text-gray-500 font-sans font-bold text-xl animate-pulse">
        Verifying Credentials...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // 🚦 The Secure Routing Logic
  if (userRole === 'Admin') {
    return <Dashboard userEmail={user.email} onLogout={() => signOut(auth)} />;
  } else if (userRole === 'Unauthorized') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 font-sans p-8 text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md border-t-4 border-red-500">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-6">
            Your email (<span className="font-bold">{user.email}</span>) is not
            registered in the Team Database. Please contact the administrator.
          </p>
          <button
            onClick={() => signOut(auth)}
            className="w-full bg-gray-900 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-800 transition"
          >
            Log Out
          </button>
        </div>
      </div>
    );
  } else {
    // Verified Agents are sent to the Agent Workspace
    return (
      <AgentQueue
        userEmail={user.email}
        userRole={userRole || 'Agent-Poster'}
        onLogout={() => signOut(auth)}
      />
    );
  }
}
