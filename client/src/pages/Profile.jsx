import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from "../components/common/Button";
import Input from "../components/common/Input";

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    currency: 'ILS',
    language: 'en',
    monthlyBudget: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        currency: user.currency || 'ILS',
        language: user.language || 'en',
        monthlyBudget: user.monthlyBudget || ''
      });
    }
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Profile Header */}
        <div className="p-6 bg-blue-600">
          <div className="flex items-center space-x-4">
            <div className="h-20 w-20 rounded-full bg-white flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {formData.username?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{formData.username}</h1>
              <p className="text-blue-100">{formData.email}</p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <div className="p-6">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Username"
                value={formData.username}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Preferred Currency
                </label>
                <select
                  value={formData.currency}
                  disabled={!isEditing}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                >
                  <option value="ILS">₪ ILS</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
              <Input
                label="Monthly Budget"
                type="number"
                value={formData.monthlyBudget}
                disabled={!isEditing}
                onChange={(e) => setFormData({ ...formData, monthlyBudget: e.target.value })}
              />
            </div>

            <div className="flex justify-end space-x-3">
              {isEditing ? (
                <>
                  <Button 
                    variant="secondary"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary"
                    onClick={() => {
                      updateProfile(formData);
                      setIsEditing(false);
                    }}
                  >
                    Save Changes
                  </Button>
                </>
              ) : (
                <Button 
                  variant="primary"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Account Settings */}
        <div className="border-t">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
            <div className="space-y-4">
              <Button variant="danger">Change Password</Button>
              <Button variant="danger">Delete Account</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};