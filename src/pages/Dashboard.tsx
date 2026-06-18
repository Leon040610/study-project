import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  CalendarCheck, 
  Clock, 
  Target,
  ArrowRight,
  Plus,
  CheckCircle2,
  Circle,
  BookOpen,
  Bell,
  Award
} from 'lucide-react';
import { planAPI, taskAPI } from '@/utils/api';
import type { Plan, Task } from '@/types';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [planList, allTasks] = await Promise.all([
          planAPI.getAll(),
          Promise.all((await planAPI.getAll()).map(p => planAPI.getById(p.id))),
        ]);
        setPlans(planList);
        setTasks(allTasks.flatMap(result => result.tasks).sort((a, b) => 
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        ).slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await taskAPI.update(taskId, completed);
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, completed } : t
      ));
    } catch (err) {
      console.error(err);
    }
  };

  const totalProgress = plans.length > 0 
    ? Math.round(plans.reduce((acc, p) => acc + p.progress, 0) / plans.length)
    : 0;

  const completedTasks = tasks.filter(t => t.completed).length;
  const totalMinutes = plans.reduce((acc, p) => acc + p.daily_minutes, 0);

  const stats = [
    { icon: TrendingUp, label: '总体进度', value: `${totalProgress}%`, color: 'from-primary to-secondary' },
    { icon: CalendarCheck, label: '学习计划', value: `${plans.length}个`, color: 'from-blue-500 to-blue-600' },
    { icon: CheckCircle2, label: '完成任务', value: `${completedTasks}/${tasks.length}`, color: 'from-green-500 to-green-600' },
    { icon: Clock, label: '每日学习', value: `${totalMinutes}分钟`, color: 'from-accent to-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">欢迎回来</h1>
          <p className="text-gray-500 mt-1">今天也要继续加油学习哦！</p>
        </div>
        <button 
          onClick={() => navigate('/plans/create')}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          创建计划
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="card hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              进行中的计划
            </h3>
            <button 
              onClick={() => navigate('/plans')}
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              查看全部 <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无学习计划</p>
              <button 
                onClick={() => navigate('/plans/create')}
                className="mt-4 text-primary hover:underline"
              >
                创建第一个计划
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.slice(0, 3).map(plan => (
                <div 
                  key={plan.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => navigate(`/plans/${plan.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{plan.title}</h4>
                    <span className="text-sm text-gray-500">{Math.round(plan.progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${plan.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {plan.start_date} - {plan.end_date}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-accent" />
              待办任务
            </h3>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-8">
              <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">暂无待办任务</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => (
                <div 
                  key={task.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <button
                    onClick={() => handleTaskComplete(task.id, !task.completed)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 hover:border-primary'
                    }`}
                  >
                    {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {task.title}
                    </p>
                    <p className="text-xs text-gray-400">{task.due_date}</p>
                  </div>
                  {task.priority === 1 && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">紧急</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
