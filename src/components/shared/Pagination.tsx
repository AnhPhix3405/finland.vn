import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function Pagination({ currentPage = 1, totalPages = 10, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && onPageChange) {
      onPageChange(page);
    }
  };

  const getVisiblePages = () => {
    const delta = 2;
    const pages: (number | string)[] = [];
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > delta + 2) {
      pages.push('...');
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);
    
    for (let i = start; i <= end; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - delta - 1) {
      pages.push('...');
    }
    
    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages.filter((page, index, array) => 
      page !== '...' || (index > 0 && index < array.length - 1)
    );
  };

  return (
    <div className="flex items-center justify-center mt-12 gap-1">
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="w-10 h-10 flex items-center justify-center rounded-sm border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Trang trước"
      >
        <ChevronLeft className="w-5 h-5" aria-hidden="true" />
      </button>
      
      {getVisiblePages().map((page, index) => (
        page === '...' ? (
          <span key={`ellipsis-${index}`} className="w-10 h-10 flex items-center justify-center text-slate-500 dark:text-slate-400">
            ...
          </span>
        ) : (
          <button
            key={page}
            onClick={() => handlePageChange(page as number)}
            className={`w-10 h-10 flex items-center justify-center rounded-sm font-bold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              currentPage === page
                ? 'bg-emerald-600 text-white focus-visible:ring-offset-2'
                : 'border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
            }`}
            aria-label={currentPage === page ? `Trang ${page}, trang hiện tại` : `Trang ${page}`}
            aria-current={currentPage === page ? "page" : undefined}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="w-10 h-10 flex items-center justify-center rounded-sm border border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Trang tiếp theo"
      >
        <ChevronRight className="w-5 h-5" aria-hidden="true" />
      </button>
    </div>
  );
}
