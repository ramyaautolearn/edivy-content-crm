import React, { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';

export default function UserManagement({
  currentUserEmail,
}: {
  currentUserEmail: string;
}) {
  const [team, setTeam] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Agent-Poster',
    status: 'Active',
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'team'), (snapshot) => {
      setTeam(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, 'team'), newUser);
    setIsAdding(false);
    setNewUser({ name: '', email: '', role: 'Agent-Poster', status: 'Active' });
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      await deleteDoc(doc(db, 'team', id));
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Team Management</h1>
          <p className="text-gray-500 mt-1">
            Add staff and assign their Assembly Line roles.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow transition"
        >
          {isAdding ? 'Cancel' : '+ Invite Team Member'}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8 max-w-4xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Add New Team Member
          </h2>
          <form
            onSubmit={handleAddUser}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. John Editor"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                placeholder="john@edivy.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Assembly Line Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="Admin">Admin (Strategy)</option>
                <option value="Agent-Filmer">Agent (Filmer)</option>
                <option value="Agent-Editor">Agent (Editor)</option>
                <option value="Agent-Poster">Agent (Poster)</option>
                <option value="Agent-Full-Stack">
                  Agent (Full-Stack / All Roles)
                </option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="w-full bg-green-600 text-white font-bold py-2 px-4 rounded-md hover:bg-green-700 transition"
              >
                Save User
              </button>
            </div>
          </form>
          <p className="text-xs text-gray-500 mt-4">
            *Note: You will also need to add their email/password in the
            Firebase Auth dashboard so they can physically log in.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr className="bg-indigo-50/30">
              <td className="p-4 font-bold text-gray-800 flex items-center gap-2">
                ⭐ You (Master Admin)
              </td>
              <td className="p-4 text-gray-600">{currentUserEmail}</td>
              <td className="p-4">
                <span className="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-xs font-bold">
                  Admin
                </span>
              </td>
              <td className="p-4 text-green-600 font-semibold">Active</td>
              <td className="p-4 text-right text-gray-400 text-sm">
                Cannot remove
              </td>
            </tr>

            {team.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-gray-800">{member.name}</td>
                <td className="p-4 text-gray-600">{member.email}</td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      member.role === 'Admin'
                        ? 'bg-indigo-100 text-indigo-800'
                        : member.role === 'Agent-Full-Stack'
                        ? 'bg-pink-100 text-pink-800'
                        : member.role === 'Agent-Filmer'
                        ? 'bg-orange-100 text-orange-800'
                        : member.role === 'Agent-Editor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {member.role}
                  </span>
                </td>
                <td className="p-4 text-green-600 font-semibold">
                  {member.status}
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDeleteUser(member.id)}
                    className="text-red-500 hover:text-red-700 font-semibold text-sm"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
