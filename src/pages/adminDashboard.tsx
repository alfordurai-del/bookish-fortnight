import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
// Assuming these are your shadcn/ui components
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const API_BASE_URL = 'http://localhost:6061/api'; // Adjust if your backend runs on a different port/domain
const ADMIN_EMAIL = 'calvingleichner181@gmail.com'; // The designated admin email

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newBalance, setNewBalance] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  // Function to fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const adminEmail = localStorage.getItem('userEmail');
      if (!adminEmail) {
        throw new Error('Admin email not found in local storage. Please log in again.');
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'x-user-email': adminEmail // Send the admin email for backend authorization
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(`Error loading users: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Effect to check admin status and fetch users on mount
  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    const adminEmail = localStorage.getItem('userEmail');

    if (isAdmin !== 'true' || adminEmail !== ADMIN_EMAIL) {
      // Not an admin or email doesn't match, redirect to login
      console.warn("Unauthorized access attempt to admin dashboard. Redirecting to login.");
      setLocation('/login');
      return;
    }

    fetchUsers();
  }, [setLocation]); // Depend on setLocation to avoid re-renders

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    setLocation('/login');
  };

  // Open Update Balance Modal
  const openUpdateBalanceModal = (user) => {
    setSelectedUser(user);
    setNewBalance(user.balance.toFixed(2)); // Pre-fill with current balance
    setModalMessage(''); // Clear previous messages
    setShowUpdateModal(true);
  };

  // Close Update Balance Modal
  const closeUpdateBalanceModal = () => {
    setShowUpdateModal(false);
    setSelectedUser(null);
    setNewBalance('');
    setModalMessage('');
  };

  // Handle Balance Update Submission
  const handleUpdateBalance = async (e) => {
    e.preventDefault();
    setModalMessage('Updating balance...');
    setIsUpdatingBalance(true);

    const userId = selectedUser.id;
    const balanceToUpdate = parseFloat(newBalance);

    if (isNaN(balanceToUpdate)) {
      setModalMessage('Please enter a valid numeric balance.');
      setIsUpdatingBalance(false);
      return;
    }

    try {
      const adminEmail = localStorage.getItem('userEmail');
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/balance`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': adminEmail // Send admin email for authorization
        },
        body: JSON.stringify({ balance: balanceToUpdate })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update balance');
      }

      const result = await response.json();
      setModalMessage(`Success: ${result.message}`);
      // Refresh the user list after successful update
      await fetchUsers();
      // Close modal after a short delay to show success message
      setTimeout(() => {
        closeUpdateBalanceModal();
      }, 1500);
    } catch (err) {
      console.error('Error updating balance:', err);
      setModalMessage(`Error: ${err.message}`);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 text-red-400">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Admin Dashboard</h1>
        <Button
          onClick={handleLogout}
          className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
        >
          Logout
        </Button>
      </div>

      <h2 className="text-2xl font-semibold text-gray-200 mb-4">All Users</h2>
      <div className="overflow-x-auto bg-gray-900 border border-gray-700 rounded-xl shadow-xl">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Balance</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {users.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-400">No users found.</td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id} className="hover:bg-gray-800 transition duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-100">{user.uid}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">${user.balance.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{new Date(user.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button
                      onClick={() => openUpdateBalanceModal(user)}
                      className="bg-blue-600 text-white text-xs py-1 px-3 rounded-md hover:bg-blue-700 transition duration-300"
                    >
                      Update Balance
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Update Balance Modal */}
      {showUpdateModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={closeUpdateBalanceModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-100 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-2xl font-bold text-gray-100 mb-6 text-center">Update User Balance</h3>
            <form onSubmit={handleUpdateBalance}>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">User ID:</label>
                <Input
                  type="text"
                  className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  value={selectedUser.id}
                  readOnly
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-2">User Email:</label>
                <Input
                  type="email"
                  className="bg-gray-700 border-gray-600 text-gray-300 cursor-not-allowed"
                  value={selectedUser.email}
                  readOnly
                />
              </div>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">New Balance:</label>
                <Input
                  type="number"
                  step="0.01"
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  required
                />
              </div>
              {modalMessage && <div className={`mb-4 text-center ${modalMessage.includes('Success') ? 'text-green-400' : 'text-red-400'} text-sm`}>{modalMessage}</div>}
              <Button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition duration-300"
                disabled={isUpdatingBalance}
              >
                {isUpdatingBalance ? "Updating..." : "Update Balance"}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
