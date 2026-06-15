import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, User, Lock } from 'lucide-react';
import { authApi } from '../../apis';
import { useAuthStore, toast } from '../../stores';
import { ROUTES } from '../../constants';
import { cn } from '../../lib/utils';
import { loginSchema, type LoginForm } from '../../schemas';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await authApi.login({
        identifier: data.identifier,
        password: data.password,
      });
      setAuth(response.user, response.accessToken);
      localStorage.setItem('access_token', response.accessToken);
      localStorage.setItem('refresh_token', response.refreshToken);
      toast.success('Đăng nhập thành công!');
      navigate(ROUTES.DASHBOARD);
    } catch (err: unknown) {
      toast.api(err, 'Đăng nhập không thành công');
      const errorResponse = err as { response?: { data?: { message?: string } } };
      setError(
        errorResponse.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản và mật khẩu.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[500px] border border-white/20 bg-black/40 backdrop-blur-md rounded-3xl p-3 sm:p-6 md:p-8 shadow-2xl flex flex-col relative text-white">
      <div className="flex items-center justify-center mb-3">
        <img src="/logo.png" alt="Cứu Hộ Việt Nam" className="h-10 sm:h-20 w-auto object-contain" />
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-wide !text-white pb-4 uppercase">
        Đăng nhập hệ thống
      </h2>

      {error && (
        <div className="mb-6 p-3.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-200 text-sm font-medium text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <User size={20} />
            </div>
            <input
              {...register('identifier')}
              type="text"
              placeholder="Số Điện Thoại / Email"
              disabled={isLoading}
              className={cn(
                "w-full pl-12 pr-4 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.identifier ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
          </div>
          {errors.identifier && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">
              {errors.identifier.message}
            </p>
          )}
        </div>

        <div>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 pointer-events-none">
              <Lock size={20} />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật Khẩu"
              disabled={isLoading}
              className={cn(
                "w-full pl-12 pr-12 py-3.5 bg-white/10 border rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200",
                errors.password ? "border-rose-500/60 focus:border-rose-500" : "border-white/15 focus:border-orange-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-rose-300 mt-1 font-medium pl-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-sm pt-1">
          <label className="flex items-center cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4.5 h-4.5 rounded border-white/20 bg-white/10 text-orange-600 focus:ring-orange-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
            />
            <span className="ml-2 text-white/90 font-medium">
              Ghi nhớ tôi
            </span>
          </label>
          <a
            href="#"
            className="text-orange-500 hover:text-orange-400 font-semibold hover:underline transition-colors"
          >
            Quên mật khẩu?
          </a>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3.5 px-4 bg-[#f06400] hover:bg-[#e05d00] active:scale-[0.985] text-white text-base font-bold rounded-xl tracking-wider transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 disabled:bg-orange-600/50 disabled:cursor-not-allowed select-none cursor-pointer mt-4 uppercase"
        >
          {isLoading && <Loader2 className="animate-spin" size={18} />}
          Đăng Nhập
        </button>
      </form>

      <p className="pt-4 text-center text-sm text-white/70">
        Chưa có tài khoản?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="text-orange-500 hover:text-orange-400 font-semibold hover:underline transition-colors"
        >
          Đăng ký ngay
        </Link>
      </p>
    </div>
  );
}
