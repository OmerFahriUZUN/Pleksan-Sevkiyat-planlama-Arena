import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Shield,
  Edit3,
  Trash2,
  Eye,
  Save,
  X,
  Loader2,
  UserCheck,
  UserX,
  Crown,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { usersAPI, handleApiError } from '../services';
import type { UpdateUserRequest } from '../services';
import type { AuthUser } from '../types';

interface UserResponse extends AuthUser {
  createdAt: string;
  updatedAt: string;
}

const ROLE_LABELS = {
  admin: 'Yönetici',
  planner: 'Planlayıcı',
  warehouse: 'Depo Operatörü',
  operator: 'Operatör',
  viewer: 'Görüntüleyici',
};

const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-800 border-red-200',
  planner: 'bg-blue-100 text-blue-800 border-blue-200',
  warehouse: 'bg-green-100 text-green-800 border-green-200',
  operator: 'bg-orange-100 text-orange-800 border-orange-200',
  viewer: 'bg-gray-100 text-gray-800 border-gray-200',
};

const ROLE_ICONS = {
  admin: Crown,
  planner: Settings,
  warehouse: UserCheck,
  operator: UserCheck,
  viewer: Eye,
};

export function AdminPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppStore();
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});
  const [] = useState<Record<string, boolean>>({});
  const [updating, setUpdating] = useState<string | null>(null);

  // Admin kontrolü
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  // Kullanıcıları yükle
  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await usersAPI.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user.id);
    setEditForm({
      role: user.role,
      password: '',
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleSaveEdit = async (userId: string) => {
    try {
      setUpdating(userId);
      const updatedUser = await usersAPI.updateUser(userId, editForm);
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setEditingUser(null);
      setEditForm({});
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;

    try {
      await usersAPI.deleteUser(userId);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      setError(handleApiError(err));
    }
  };


  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-8 h-8 text-red-600" />
          <h1 className="text-3xl font-bold text-gray-900">Yönetici Paneli</h1>
        </div>
        <p className="text-gray-600">Kullanıcı yönetimi ve sistem ayarları</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
              <p className="text-sm text-gray-600">Toplam Kullanıcı</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-sm text-gray-600">Yönetici</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'planner').length}
              </p>
              <p className="text-sm text-gray-600">Planlayıcı</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'operator').length}
              </p>
              <p className="text-sm text-gray-600">Operatör</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role === 'warehouse').length}
              </p>
              <p className="text-sm text-gray-600">Depo Operatörü</p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Kullanıcı Yönetimi</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Kullanıcılar yükleniyor...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kayıt Tarihi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => {
                  const isEditing = editingUser === user.id;
                  const RoleIcon = ROLE_ICONS[user.role as keyof typeof ROLE_ICONS];

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{user.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <select
                            value={editForm.role || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="viewer">Görüntüleyici</option>
                            <option value="warehouse">Depo Operatörü</option>
                            <option value="operator">Operatör</option>
                            <option value="planner">Planlayıcı</option>
                            <option value="admin">Yönetici</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROLE_COLORS[user.role as keyof typeof ROLE_COLORS]}`}>
                            <RoleIcon className="w-3 h-3" />
                            {ROLE_LABELS[user.role as keyof typeof ROLE_LABELS]}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {user.isActive ? (
                            <>
                              <UserCheck className="w-3 h-3" />
                              Aktif
                            </>
                          ) : (
                            <>
                              <UserX className="w-3 h-3" />
                              Pasif
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(user.id)}
                              disabled={updating === user.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              {updating === user.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Save className="w-3 h-3" />
                              )}
                              Kaydet
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700"
                            >
                              <X className="w-3 h-3" />
                              İptal
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEdit(user)}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              <Edit3 className="w-3 h-3" />
                              Düzenle
                            </button>
                            {user.id !== currentUser.id && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Sil
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}