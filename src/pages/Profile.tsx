import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Calendar, Settings, Save, ArrowLeft, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import type { User as UserType } from '@/types';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState<UserType | null>(user);

  const handleSave = () => {
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    localStorage.removeItem('token');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">个人资料</h1>
          <p className="text-gray-500 mt-1">管理您的账户信息</p>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-3">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="btn-outline flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                编辑
              </button>
            ) : (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className="btn-outline"
                >
                  取消
                </button>
                <button
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  保存
                </button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <User className="w-4 h-4 text-gray-400" />
                用户名
              </label>
              {editing ? (
                <input
                  type="text"
                  value={profileData?.name || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="input-field"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{user.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                邮箱
              </label>
              <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                手机号
              </label>
              {editing ? (
                <input
                  type="tel"
                  value={profileData?.phone || ''}
                  onChange={(e) => setProfileData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                  className="input-field"
                  placeholder="可选"
                />
              ) : (
                <p className="text-gray-900 bg-gray-50 rounded-lg p-3">{user.phone || '未设置'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                注册时间
              </label>
              <p className="text-gray-900 bg-gray-50 rounded-lg p-3">
                {new Date(user.created_at).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" />
          账户安全
        </h3>
        <div className="space-y-3">
          <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between">
            <span className="text-gray-700">修改密码</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between">
            <span className="text-gray-700">双因素认证</span>
            <span className="text-gray-400">→</span>
          </button>
          <button className="w-full text-left p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-between">
            <span className="text-red-600">注销账户</span>
            <span className="text-red-400">→</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            <span className="text-gray-700">退出登录</span>
            <span className="text-gray-400">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
