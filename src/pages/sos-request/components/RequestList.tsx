import RequestCard from './RequestCard';
import type { SosRequestItem } from './mockData';

interface RequestListProps {
  requests: SosRequestItem[];
  selectedRequestId: number | null;
  onSelectRequest: (id: number) => void;
}

export default function RequestList({ requests, selectedRequestId, onSelectRequest }: RequestListProps) {
  return (
    <div className="lg:col-span-4 flex flex-col gap-2.5 max-h-[660px] overflow-y-auto pr-1 no-scrollbar">
      {requests.map((req) => (
        <RequestCard
          key={req.id}
          request={req}
          isSelected={selectedRequestId === req.id}
          onClick={() => onSelectRequest(req.id)}
        />
      ))}

      <button className="py-2.5 text-center text-xs font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 dark:hover:text-indigo-300 bg-white dark:bg-gray-900 border border-slate-150 dark:border-gray-800 rounded-xl transition duration-155 select-none cursor-pointer">
        Xem thêm yêu cầu
      </button>
    </div>
  );
}
