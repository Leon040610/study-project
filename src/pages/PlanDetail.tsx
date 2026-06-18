import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Target, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Bell,
  Trash2,
  Edit3,
  BookOpen
} from 'lucide-react';
import { planAPI, taskAPI, reminderAPI } from '@/utils/api';
import type { Plan, Task } from '@/types';

export const PlanDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const data = await planAPI.getById(id);
        setPlan(data.plan);
        setTasks(data.tasks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleTaskComplete = async (taskId: string, completed: boolean) => {
    try {
      await taskAPI.update(taskId, completed);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed } : t));
      
      const completedCount = tasks.filter(t => t.id === taskId ? completed : t.completed).length;
      const progress = (completedCount / tasks.length) * 100;
      setPlan(prev => prev ? { ...prev, progress } : null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = async () => {
    if (!id || !plan) return;
    try {
      await reminderAPI.create({
        planId: id,
        time: '09:00',
        method: 'email',
        frequency: 'daily',
      });
      alert('提醒设置成功！');
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  if (!id) return null;

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="space-y-6">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="card h-48 bg-gray-100 animate-pulse"></div>
          <div className="card h-96 bg-gray-100 animate-pulse"></div>
        </div>
      ) : !plan ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">计划不存在</p>
          <button 
            onClick={() => navigate('/plans')}
            className="mt-4 btn-primary"
          >
            返回计划列表
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/plans')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
              <p className="text-gray-500 mt-1">{plan.goal}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddReminder}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-accent"
                title="添加提醒"
              >
                <Bell className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(`/plans/${id}`)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-primary"
                title="编辑计划"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  if (confirm('确定要删除这个计划吗？')) {
                    planAPI.delete(id).then(() => navigate('/plans'));
                  }
                }}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors text-gray-600 hover:text-red-500"
                title="删除计划"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">学习进度</p>
                  <p className="text-xl font-bold text-gray-900">{Math.round(plan.progress)}%</p>
                </div>
              </div>
              <div className="progress-bar mt-3">
                <div 
                  className="progress-fill"
                  style={{ width: `${plan.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">完成任务</p>
                  <p className="text-xl font-bold text-gray-900">{completedCount}/{tasks.length}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">学习期限</p>
                  <p className="text-sm font-medium text-gray-900">{plan.start_date}<br />{plan.end_date}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">每日学习</p>
                  <p className="text-xl font-bold text-gray-900">{plan.daily_minutes}分钟</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                学习任务
              </h3>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="btn-outline flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                添加任务
              </button>
            </div>

            {showAddTask && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  placeholder="输入新任务名称..."
                  className="input-field mb-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (newTask.trim()) {
                        setTasks(prev => [...prev, {
                          id: Date.now().toString(),
                          plan_id: id,
                          title: newTask,
                          description: '',
                          due_date: plan.end_date,
                          completed: false,
                          priority: 2,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        }]);
                        setNewTask('');
                        setShowAddTask(false);
                      }
                    }}
                    className="btn-primary text-sm"
                  >
                    添加
                  </button>
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="btn-outline text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">暂无任务</p>
                <button 
                  onClick={() => setShowAddTask(true)}
                  className="mt-4 text-primary hover:underline"
                >
                  添加任务
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                      task.completed 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-gray-50 border-gray-200 hover:border-primary/30'
                    }`}
                  >
                    <button
                      onClick={() => handleTaskComplete(task.id, !task.completed)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : 'border-gray-300 hover:border-primary'
                      }`}
                    >
                      {task.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-400">{task.due_date}</span>
                      {task.priority === 1 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">紧急</span>
                      )}
                      <button
                        onClick={() => setTasks(prev => prev.filter(t => t.id !== task.id))}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
