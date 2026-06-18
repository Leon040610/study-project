import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, TrendingUp, MoreVertical, Trash2, Edit3 } from 'lucide-react';
import { planAPI } from '@/utils/api';
import type { Plan } from '@/types';

export const PlanList = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await planAPI.getAll();
        setPlans(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleDelete = async (planId: string) => {
    if (confirm('确定要删除这个计划吗？')) {
      try {
        await planAPI.delete(planId);
        setPlans(prev => prev.filter(p => p.id !== planId));
        setSelectedPlan(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getDaysRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days}天` : '已到期';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">学习计划</h1>
          <p className="text-gray-500 mt-1">管理您的所有学习计划</p>
        </div>
        <button 
          onClick={() => navigate('/plans/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          创建计划
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="card h-48 bg-gray-100 animate-pulse"></div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">暂无学习计划</h3>
          <p className="text-gray-500 mt-2">创建一个新计划开始您的学习之旅</p>
          <button 
            onClick={() => navigate('/plans/create')}
            className="mt-4 btn-primary"
          >
            创建计划
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div 
              key={plan.id}
              className="card hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/plans/${plan.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{plan.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{plan.goal}</p>
                </div>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlan(selectedPlan === plan.id ? null : plan.id);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {selectedPlan === plan.id && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/plans/${plan.id}`);
                          setSelectedPlan(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        编辑
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(plan.id);
                        }}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        删除
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    期限
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {formatDate(plan.start_date)} - {formatDate(plan.end_date)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    每日
                  </span>
                  <span className="text-sm font-medium text-gray-900">{plan.daily_minutes}分钟</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    进度
                  </span>
                  <span className="text-sm font-medium text-primary">{Math.round(plan.progress)}%</span>
                </div>

                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${plan.progress}%` }}
                  ></div>
                </div>

                <div className="text-right">
                  <span className={`text-xs ${plan.progress >= 100 ? 'text-green-600' : 'text-accent'}`}>
                    {plan.progress >= 100 ? '已完成' : `剩余 ${getDaysRemaining(plan.end_date)}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
