import { Form, Input, Button, Checkbox, Message } from '@arco-design/web-react';
import { User, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

const FormItem = Form.Item;

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      await login({ username: values.username, password: values.password });
      Message.success('登录成功！');
      navigate('/dashboard');
    } catch (error) {
      Message.error((error as Error).message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-blue-50">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-gradient-to-br from-pink-300/40 to-rose-300/30 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-300/40 to-sky-300/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-amber-200/20 to-yellow-200/10 blur-3xl" />
        </div>
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(248,180,217,0.3)_0%,transparent_50%),radial-gradient(circle_at_80%_20%,rgba(74,144,217,0.3)_0%,transparent_50%),radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.1)_0%,transparent_60%)]" />

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-white/40 p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-rose-500 mb-4 shadow-lg shadow-pink-200/50">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent mb-2">
              医美管理系统
            </h1>
            <p className="text-gray-500 text-sm">专业·安全·高效</p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onSubmit={handleSubmit}
            initialValues={{ remember: true }}
            className="space-y-5"
          >
            <FormItem
              field="username"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input
                prefix={<User className="w-4 h-4 text-gray-400" />}
                placeholder="请输入用户名"
                size="large"
                className="h-12"
              />
            </FormItem>

            <FormItem
              field="password"
              label="密码"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input
                prefix={<Lock className="w-4 h-4 text-gray-400" />}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-pink-500 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                }
                type={showPassword ? 'text' : 'password'}
                placeholder="请输入密码"
                size="large"
                className="h-12"
              />
            </FormItem>

            <div className="flex items-center justify-between">
              <FormItem field="remember" noStyle>
                <Checkbox>记住我</Checkbox>
              </FormItem>
              <a
                href="#"
                className="text-sm text-pink-500 hover:text-pink-600 transition-colors"
              >
                忘记密码？
              </a>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              size="large"
              long
              loading={loading}
              className="h-12 text-base font-medium mt-2"
            >
              登录
            </Button>
          </Form>

          <div className="mt-8 pt-6 border-t border-gray-200/50">
            <p className="text-center text-xs text-gray-400">
              登录即表示您同意我们的
              <a href="#" className="text-pink-500 hover:text-pink-600 mx-1">服务条款</a>
              和
              <a href="#" className="text-pink-500 hover:text-pink-600 mx-1">隐私政策</a>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-6 text-gray-400">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs">系统正常</span>
            </div>
            <div className="text-xs">v1.0.0</div>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          © 2024 医美管理系统 | 专业医疗美容管理解决方案
        </div>
      </div>
    </div>
  );
}
