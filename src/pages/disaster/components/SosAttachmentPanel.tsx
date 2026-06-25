import { ExternalLink } from 'lucide-react';

interface SosAttachmentPanelProps {
  imageUrls?: string[];
}

export default function SosAttachmentPanel({ imageUrls }: SosAttachmentPanelProps) {
  const count = imageUrls?.length || 0;

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 overflow-hidden">
      {/* Section header */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-0.5 h-4 bg-blue-500 rounded-full flex-shrink-0" />
        <span className="text-xs font-bold uppercase tracking-widest text-gray-700 dark:text-gray-200">
          Hình ảnh hiện trường ({count})
        </span>
      </div>

      <div className="p-4">
        {count > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {imageUrls!.map((url, index) => (
              <a
                key={index}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="relative group rounded-lg overflow-hidden aspect-[4/3] bg-gray-100 dark:bg-gray-800 block"
              >
                <img
                  src={url}
                  alt={`Hiện trường ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
                  <ExternalLink size={16} className="text-white drop-shadow" />
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-gray-400 font-normal italic">
            Không có hình ảnh hiện trường.
          </div>
        )}
      </div>
    </div>
  );
}
