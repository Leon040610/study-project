import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mail, Lock, Phone, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0d9488 100%)',
    padding: '20px',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  blob1: {
    position: 'absolute' as const,
    top: '-100px',
    right: '-100px',
    width: '500px',
    height: '500px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '50%',
    filter: 'blur(60px)',
  },
  blob2: {
    position: 'absolute' as const,
    bottom: '-100px',
    left: '-100px',
    width: '400px',
    height: '400px',
    background: 'rgba(245,158,11,0.1)',
    borderRadius: '50%',
    filter: 'blur(60px)',
  },
  card: {
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '420px',
    overflow: 'hidden' as const,
    position: 'relative' as const,
    zIndex: 10,
  },
  cardHeader: {
    background: 'linear-gradient(135deg, #1e40af 0%, #0d9488 100%)',
    padding: '48px 40px',
    textAlign: 'center' as const,
  },
  logo: {
    width: '72px',
    height: '72px',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '0 auto 20px',
    fontSize: '36px',
  },
  headerTitle: {
    fontSize: '32px',
    fontWeight: '700' as const,
    color: 'white',
    marginBottom: '8px',
  },
  headerSubtitle: {
    opacity: '0.9',
    fontSize: '15px',
    color: 'white',
  },
  cardBody: {
    padding: '40px',
  },
  error: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#dc2626',
    fontSize: '13px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formGroup: {
    marginBottom: '24px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600' as const,
    color: '#334155',
    marginBottom: '8px',
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  input: {
    width: '100%',
    padding: '14px 16px 14px 48px',
    border: '2px solid #e2e8f0',
    borderRadius: '14px',
    fontSize: '15px',
    color: '#1e293b',
    transition: 'all 0.3s',
    outline: 'none',
    background: 'white',
  },
  icon: {
    position: 'absolute' as const,
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    color: '#94a3b8',
    width: '20px',
    height: '20px',
  },
  passwordToggle: {
    position: 'absolute' as const,
    right: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '18px',
    padding: '0',
  },
  button: {
    width: '100%',
    background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '14px',
    fontSize: '16px',
    fontWeight: '600' as const,
    cursor: 'pointer',
    transition: 'all 0.3s',
    boxShadow: '0 4px 15px rgba(30,64,175,0.4)',
  },
  toggleLink: {
    textAlign: 'center' as const,
    marginTop: '28px',
    paddingTop: '28px',
    borderTop: '1px solid #e2e8f0',
  },
  toggleText: {
    fontSize: '14px',
    color: '#64748b',
  },
  toggleButton: {
    background: 'none',
    border: 'none',
    color: '#1e40af',
    fontWeight: '600' as const,
    cursor: 'pointer',
    fontSize: '14px',
    marginLeft: '4px',
    padding: '0',
  },
  footer: {
    textAlign: 'center' as const,
    marginTop: '24px',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
  },
};

export const Login = () => {
  const navigate = useNavigate();
  const { login, register, loading, error } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login({ email: formData.email, password: formData.password });
        navigate('/dashboard');
      } else {
        await register({
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          name: formData.name,
        });
        navigate('/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div style={styles.page}>
      <div style={styles.blob1}></div>
      <div style={styles.blob2}></div>
      
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.logo}>📚</div>
          <h1 style={styles.headerTitle}>{isLogin ? '欢迎回来' : '创建账户'}</h1>
          <p style={styles.headerSubtitle}>{isLogin ? '登录您的学习计划助手' : '开始您的学习之旅'}</p>
        </div>

        <div style={styles.cardBody}>
          {error && (
            <div style={styles.error}>
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.form}>
            {!isLogin && (
              <div style={styles.formGroup}>
                <label style={styles.label}>用户名</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.icon}>
                    <User style={{ width: '100%', height: '100%' }} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="请输入用户名"
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>邮箱</label>
              <div style={styles.inputWrapper}>
                <div style={styles.icon}>
                  <Mail style={{ width: '100%', height: '100%' }} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="请输入邮箱地址"
                  style={styles.input}
                />
              </div>
            </div>

            {!isLogin && (
              <div style={styles.formGroup}>
                <label style={styles.label}>手机号（可选）</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.icon}>
                    <Phone style={{ width: '100%', height: '100%' }} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="请输入手机号"
                    style={styles.input}
                  />
                </div>
              </div>
            )}

            <div style={styles.formGroup}>
              <label style={styles.label}>密码</label>
              <div style={styles.inputWrapper}>
                <div style={styles.icon}>
                  <Lock style={{ width: '100%', height: '100%' }} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="请输入密码"
                  style={{ ...styles.input, paddingRight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.passwordToggle}
                >
                  {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '处理中...' : (isLogin ? '登录' : '注册')}
            </button>
          </form>

          <div style={styles.toggleLink}>
            <p style={styles.toggleText}>
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button
                onClick={() => setIsLogin(!isLogin)}
                style={styles.toggleButton}
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <p style={styles.footer}>© 2024 智能学习计划助手 | 让学习更高效</p>
    </div>
  );
};
