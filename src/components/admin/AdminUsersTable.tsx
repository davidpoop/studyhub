'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

type Role = 'USER' | 'CREATOR' | 'ADMIN';

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  createdAt: Date;
  _count: { content: number };
}

const roleColors: Record<Role, string> = {
  USER: 'bg-gray-100 text-gray-700',
  CREATOR: 'bg-blue-100 text-blue-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export function AdminUsersTable({ users: initial }: { users: UserRow[] }) {
  const [users, setUsers] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  const updateRole = async (userId: string, role: Role) => {
    setLoading(userId);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });
      if (!res.ok) throw new Error();
      toast.success('Role updated');
      setUsers(u => u.map(user => user.id === userId ? { ...user, role } : user));
    } catch {
      toast.error('Failed to update role');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-700">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Uploads</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Joined</th>
              <th className="text-left px-4 py-3 font-medium text-gray-700">Change role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{user.name ?? 'No name'}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={cn('badge', roleColors[user.role])}>{user.role}</span>
                </td>
                <td className="px-4 py-3 text-gray-600">{user._count.content}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={user.role}
                    onChange={e => updateRole(user.id, e.target.value as Role)}
                    disabled={loading === user.id}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="USER">USER</option>
                    <option value="CREATOR">CREATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
