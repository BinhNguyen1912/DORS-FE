import React, { useRef, useEffect } from 'react';
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Eraser } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Sync value from prop to editor (only if it differs from current editor content to avoid cursor jumps)
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const executeCommand = (command: string, arg = '') => {
    document.execCommand(command, false, arg);
    handleInput();
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 border-b border-slate-200">
        {/* Style actions */}
        <button
          type="button"
          onClick={() => executeCommand('bold')}
          className="px-2 py-1 hover:bg-slate-200 rounded text-xs font-bold text-black cursor-pointer"
          title="In đậm (Ctrl+B)"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => executeCommand('italic')}
          className="px-2 py-1 hover:bg-slate-200 rounded text-xs italic text-black cursor-pointer"
          title="In nghiêng (Ctrl+I)"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => executeCommand('underline')}
          className="px-2 py-1 hover:bg-slate-200 rounded text-xs underline text-black cursor-pointer"
          title="Gạch chân (Ctrl+U)"
        >
          U
        </button>

        <div className="h-4 w-px bg-slate-300" />

        {/* Alignment actions with icons */}
        <button
          type="button"
          onClick={() => executeCommand('justifyLeft')}
          className="p-1 hover:bg-slate-200 rounded text-black cursor-pointer"
          title="Căn trái"
        >
          <AlignLeft size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyCenter')}
          className="p-1 hover:bg-slate-200 rounded text-black cursor-pointer"
          title="Căn giữa"
        >
          <AlignCenter size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyRight')}
          className="p-1 hover:bg-slate-200 rounded text-black cursor-pointer"
          title="Căn phải"
        >
          <AlignRight size={15} />
        </button>
        <button
          type="button"
          onClick={() => executeCommand('justifyFull')}
          className="p-1 hover:bg-slate-200 rounded text-black cursor-pointer"
          title="Căn đều"
        >
          <AlignJustify size={15} />
        </button>

        <div className="h-4 w-px bg-slate-300" />

        {/* Font Family Selection */}
        <select
          onChange={(e) => executeCommand('fontName', e.target.value)}
          defaultValue=""
          className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] bg-white text-black cursor-pointer focus:outline-none"
        >
          <option value="" disabled>Font chữ</option>
          <option value="system-ui">Mặc định</option>
          <option value="Arial">Arial</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
        </select>

        {/* Font Size Selection */}
        <select
          onChange={(e) => executeCommand('fontSize', e.target.value)}
          defaultValue=""
          className="border border-slate-300 rounded px-1.5 py-0.5 text-[10px] bg-white text-black cursor-pointer focus:outline-none"
        >
          <option value="" disabled>Cỡ chữ</option>
          <option value="1">Nhỏ nhất (8pt)</option>
          <option value="2">Nhỏ (10pt)</option>
          <option value="3">Trung bình (12pt)</option>
          <option value="4">Lớn (14pt)</option>
          <option value="5">Khá lớn (18pt)</option>
          <option value="6">Rất lớn (24pt)</option>
          <option value="7">Cực đại (36pt)</option>
        </select>

        <div className="h-4 w-px bg-slate-300" />

        {/* Clear formatting with icon */}
        <button
          type="button"
          onClick={() => executeCommand('removeFormat')}
          className="p-1 hover:bg-slate-200 rounded text-black cursor-pointer flex items-center gap-1 text-[10px]"
          title="Xóa định dạng"
        >
          <Eraser size={14} />
          <span>Xóa</span>
        </button>
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        data-placeholder={placeholder}
        className="w-full min-h-[120px] p-3 text-xs text-black focus:outline-none bg-white text-left font-normal leading-relaxed relative before:content-[attr(data-placeholder)] before:text-black/40 before:absolute before:pointer-events-none empty:before:block before:hidden"
        style={{ outline: 'none' }}
      />
    </div>
  );
}
