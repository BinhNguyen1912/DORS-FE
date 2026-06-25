import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Loader2, X, Search } from 'lucide-react';
import { searchAddress, type GeocodingResult } from '../../lib/geocoding';
import { cn } from '../../lib/utils';

export interface AddressAutocompleteResult {
  address: string;
  lat: number;
  lng: number;
}

interface AddressAutocompleteProps {
  /** Giá trị địa chỉ text hiện tại */
  value?: string;
  /** Callback khi user chọn địa chỉ từ danh sách gợi ý */
  onChange: (result: AddressAutocompleteResult) => void;
  /** Callback khi user xóa / thay đổi text thủ công */
  onTextChange?: (text: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  provinceName?: string;
}

const DEBOUNCE_MS = 400;

export default function AddressAutocomplete({
  value = '',
  onChange,
  onTextChange,
  placeholder = 'Nhập địa chỉ để tìm kiếm...',
  className,
  label,
  required,
  error,
  disabled,
  provinceName,
}: AddressAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hasSelected, setHasSelected] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 3) {
      setResults([]);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const found = await searchAddress(query, provinceName);
      setResults(found);
      setIsOpen(found.length > 0);
    } finally {
      setIsLoading(false);
    }
  }, [provinceName]);

  // Tự động tìm kiếm lại nếu Tỉnh/Thành phố thay đổi trong khi đang gõ
  useEffect(() => {
    if (inputValue.trim().length >= 3 && !hasSelected) {
      doSearch(inputValue);
    }
  }, [provinceName, doSearch, inputValue, hasSelected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setHasSelected(false);
    onTextChange?.(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), DEBOUNCE_MS);
  };

  const handleSelect = (item: GeocodingResult) => {
    setInputValue(item.displayName);
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setHasSelected(true);
    onChange({ address: item.displayName, lat: item.lat, lng: item.lng });
  };

  const handleClear = () => {
    setInputValue('');
    setResults([]);
    setIsOpen(false);
    setHasSelected(false);
    onTextChange?.('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      {label && (
        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0 && !hasSelected) setIsOpen(true); }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          className={cn(
            'w-full pl-8 pr-8 py-2 rounded-xl text-xs border bg-slate-50/50 dark:bg-gray-900 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all',
            error
              ? 'border-red-500 focus:border-red-500'
              : hasSelected
              ? 'border-green-400 dark:border-green-600'
              : 'border-gray-200 dark:border-gray-700 focus:border-indigo-500 dark:focus:border-indigo-400',
            disabled && 'opacity-60 cursor-not-allowed'
          )}
        />

        {/* Right side: loader or clear */}
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && <Loader2 size={12} className="animate-spin text-indigo-500" />}
          {!isLoading && inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              tabIndex={-1}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="text-[10px] text-red-500 font-semibold mt-1">{error}</p>
      )}

      {/* Dropdown suggestions */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden max-h-60 overflow-y-auto custom-scroll">
          {results.map((item, index) => (
            <button
              key={`${item.lat}-${item.lng}-${index}`}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
              onMouseEnter={() => setActiveIndex(index)}
              className={cn(
                'w-full text-left px-4 py-3 flex items-start gap-3 transition-colors border-b border-gray-100 dark:border-gray-700/50 last:border-0',
                index === activeIndex
                  ? 'bg-indigo-50 dark:bg-indigo-950/30'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-750'
              )}
            >
              <MapPin
                size={14}
                className="text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5"
              />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {item.shortName}
                </p>
                {item.secondary && (
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 font-normal">
                    {item.secondary}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {isOpen && !isLoading && results.length === 0 && inputValue.trim().length >= 3 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg px-4 py-3">
          <p className="text-xs text-gray-400 text-center font-normal">
            Không tìm thấy địa chỉ phù hợp
          </p>
        </div>
      )}
    </div>
  );
}
