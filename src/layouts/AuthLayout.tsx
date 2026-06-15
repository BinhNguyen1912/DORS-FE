import { Outlet } from 'react-router-dom';
import ToastContainer from '../components/common/ToastContainer';

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/auth-bg.png')",
        }}
      />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1.5px]" />

      <div className="relative z-10 w-full max-w-xl flex flex-col items-center justify-center py-4">
        <Outlet />
      </div>
      <ToastContainer />
    </div>
  );
}

