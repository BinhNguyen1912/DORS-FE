import React, { useState, useRef } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import api from '../../lib/axios';
import { cn } from '../../lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  className?: string;
}

export default function ImageUpload({
  value = '',
  onChange,
  folder = 'general',
  label = 'Tải ảnh lên',
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP...)');
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Dung lượng ảnh tối đa là 10MB');
      return;
    }

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post<{ url: string }>(
        `/upload/single?folder=${folder}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const uploadedUrl = response.data?.url;
      if (uploadedUrl) {
        onChange(uploadedUrl);
      } else {
        setError('Không nhận được URL ảnh từ máy chủ');
      }
    } catch (err: any) {
      console.error('Lỗi upload file:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setIsUploading(false);
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setError(null);
  };

  return (
    <div className={cn('space-y-1.5 text-left', className)}>
      {label && (
        <span className="block text-xs font-bold text-gray-700 dark:text-gray-300">
          {label}
        </span>
      )}
      
      <div
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative w-full h-32 rounded-xl border border-dashed border-gray-250 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-900/50 hover:bg-slate-50 dark:hover:bg-gray-900 cursor-pointer flex flex-col items-center justify-center gap-2 p-4 transition-all overflow-hidden group',
          value && 'border-solid border-gray-200 dark:border-gray-750'
        )}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={isUploading}
        />

        {value ? (
          <>
            {/* Image Preview */}
            <img
              src={value}
              alt="Uploaded Preview"
              className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-gray-950"
            />
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200">
              <span className="text-white text-xs font-bold bg-black/60 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Upload size={12} /> Thay đổi ảnh
              </span>
            </div>
            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg shadow-sm transition-all z-10"
              title="Xóa ảnh"
            >
              <X size={14} />
            </button>
          </>
        ) : (
          <>
            {/* Empty State */}
            {isUploading ? (
              <div className="flex flex-col items-center gap-1.5">
                <Loader2 className="animate-spin text-indigo-500" size={24} />
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold animate-pulse">
                  Đang tải lên...
                </span>
              </div>
            ) : (
              <>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-105 transition-all">
                  <ImageIcon size={20} />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300">
                    Chọn tệp hình ảnh
                  </p>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold mt-0.5">
                    Hỗ trợ PNG, JPG, WEBP tối đa 10MB
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {error && (
        <p className="text-[9px] text-red-500 font-bold leading-none mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
