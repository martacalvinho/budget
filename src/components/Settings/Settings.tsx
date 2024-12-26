import React from 'react';
import CategoryManagement from './CategoryManagement';
import UserManagement from './UserManagement';

export default function Settings() {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Settings</h2>

      {/* User Management Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <UserManagement />
      </div>

      {/* Category Management Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <CategoryManagement type="fixed" />
        </div>
        <div className="bg-white rounded-lg shadow-md p-6">
          <CategoryManagement type="flexible" />
        </div>
      </div>
    </div>
  );
}
