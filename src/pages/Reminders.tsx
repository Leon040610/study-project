import { useState, useEffect } from 'react';
import { Plus, Bell, Clock, Mail, Smartphone, Trash2, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import { reminderAPI, planAPI } from '@/utils/api';
import type { Reminder, Plan } from '@/types';

export const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    planId: '',
    time: '09:00',
    method: 'email' as const,
    frequency: 'daily' as const,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reminderList, planList] = await Promise.all([
          reminderAPI.getAll(),
          planAPI.getAll(),
        ]);
        setReminders(reminderList);
        setPlans(planList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreate = async () => {
    if (!newReminder.planId) {
      alert('请选择学习计划');
      return;
    }
    try {
      await reminderAPI.create(newReminder);
      setShowAddModal(false);
      setNewReminder({
        planId: '',
        time: '09:00',
        method: 'email',
        frequency: 'daily',
      });
      const data = await reminderAPI.getAll();
      setReminders(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = async (reminderId: string, enabled: boolean) => {
    try {
      await reminderAPI.update(reminderId, { enabled });
      setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, enabled } : r));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (reminderId: string) => {
    if (confirm('确定要删除这个提醒吗？')) {
      try {
        await reminderAPI.delete(reminderId);
        setReminders(prev => prev.filter(r => r.id !== reminderId));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getPlanTitle = (planId: string) => {
    return plans.find(p => p.id === planId)?.title || '未知计划';
  };

  const getMethodLabel = (method: string) => {
    return method === 'email' ? '邮件' : '推送通知';
  };

  const getFrequencyLabel = (frequency: string) => {
    return frequency === 'daily' ? '每天' : '每周';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">提醒设置</h1>
          <p className="text-gray-500 mt-1">管理您的学习提醒</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          添加提醒
        </button>
      </div>

      {loading ? (
        <div className="card h-96 bg-gray-100 animate-pulse"></div>
      ) : reminders.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">暂无提醒</h3>
          <p className="text-gray-500 mt-2">设置提醒帮助您按时学习</p>
          <button 
            onClick={() => setShowAddModal(true)}
            className="mt-4 btn-primary"
          >
            添加提醒
          </button>
        </div>
      ) : (
        <div className="card space-y-4">
          {reminders.map(reminder => (
            <div 
              key={reminder.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  reminder.enabled ? 'bg-accent/10' : 'bg-gray-100'
                }`}>
                  <Bell className={`w-5 h-5 ${reminder.enabled ? 'text-accent' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{getPlanTitle(reminder.planId)}</h4>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {reminder.reminder_time}
                    </span>
                    <span className="flex items-center gap-1">
                      {reminder.method === 'email' ? <Mail className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                      {getMethodLabel(reminder.method)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {getFrequencyLabel(reminder.frequency)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(reminder.id, !reminder.enabled)}
                  className="p-2 rounded-lg transition-colors"
                >
                  {reminder.enabled ? (
                    <ToggleRight className="w-6 h-6 text-accent" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(reminder.id)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">添加提醒</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学习计划</label>
                <select
                  value={newReminder.planId}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, planId: e.target.value }))}
                  className="input-field"
                >
                  <option value="">请选择计划</option>
                  {plans.map(plan => (
                    <option key={plan.id} value={plan.id}>{plan.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">提醒时间</label>
                <input
                  type="time"
                  value={newReminder.time}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">通知方式</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="email"
                      checked={newReminder.method === 'email'}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, method: e.target.value as 'email' }))}
                      className="w-4 h-4 text-primary"
                    />
                    <Mail className="w-5 h-5" />
                    <span>邮件</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="method"
                      value="push"
                      checked={newReminder.method === 'push'}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, method: e.target.value as 'push' }))}
                      className="w-4 h-4 text-primary"
                    />
                    <Smartphone className="w-5 h-5" />
                    <span>推送通知</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">提醒频率</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="daily"
                      checked={newReminder.frequency === 'daily'}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value as 'daily' }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>每天</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value="weekly"
                      checked={newReminder.frequency === 'weekly'}
                      onChange={(e) => setNewReminder(prev => ({ ...prev, frequency: e.target.value as 'weekly' }))}
                      className="w-4 h-4 text-primary"
                    />
                    <span>每周</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 btn-primary"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
