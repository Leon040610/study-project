import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, Target, Sparkles } from 'lucide-react';
import { planAPI } from '@/utils/api';

export const PlanCreate = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    startDate: '',
    endDate: '',
    dailyMinutes: 60,
  });

  const [generatedTasks, setGeneratedTasks] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.type === 'number' ? parseInt(e.target.value) : e.target.value,
    }));
  };

  const generateTasks = () => {
    if (!formData.title || !formData.goal || !formData.startDate || !formData.endDate) {
      alert('请填写所有必填项');
      return;
    }

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    if (days <= 0) {
      alert('结束日期必须晚于开始日期');
      return;
    }

    const tasks: string[] = [];
    const subjects = ['基础知识', '核心概念', '实践练习', '综合复习', '模拟测试'];
    
    for (let i = 1; i <= Math.min(days, 14); i++) {
      const subjectIndex = (i - 1) % subjects.length;
      const weekNum = Math.ceil(i / 7);
      tasks.push(`第${weekNum}周 - ${subjects[subjectIndex]} - 第${i}天`);
    }
    
    setGeneratedTasks(tasks);
    setShowPreview(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await planAPI.create(formData);
      navigate('/plans');
    } catch (err) {
      console.error(err);
      alert('创建计划失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/plans')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">创建学习计划</h1>
          <p className="text-gray-500 mt-1">设定目标，开启您的学习之旅</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                计划名称
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="例如：Python 编程学习"
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">学习目标</label>
              <textarea
                name="goal"
                value={formData.goal}
                onChange={handleChange}
                required
                rows={4}
                placeholder="描述您的学习目标和期望成果..."
                className="input-field resize-none"
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  开始日期
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  结束日期
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                每日学习时长
              </label>
              <select
                name="dailyMinutes"
                value={formData.dailyMinutes}
                onChange={handleChange}
                className="input-field"
              >
                <option value={30}>30分钟</option>
                <option value={45}>45分钟</option>
                <option value={60}>60分钟（1小时）</option>
                <option value={90}>90分钟（1.5小时）</option>
                <option value={120}>120分钟（2小时）</option>
                <option value={180}>180分钟（3小时）</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={generateTasks}
                className="flex-1 btn-outline flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                预览计划
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary"
              >
                {loading ? '创建中...' : '创建计划'}
              </button>
            </div>
          </form>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            计划预览
          </h3>

          {!showPreview ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">填写信息后点击"预览计划"查看生成的任务</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {generatedTasks.map((task, index) => (
                <div 
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-primary/10"
                >
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary text-xs font-medium">
                    {index + 1}
                  </div>
                  <span className="text-sm text-gray-700">{task}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
