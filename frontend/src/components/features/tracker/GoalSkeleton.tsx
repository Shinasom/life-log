'use client';

export default function GoalSkeleton() {
  return (
    <div className="bg-white border rounded-xl shadow-sm overflow-hidden h-[72px] animate-pulse">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Circle Icon Placeholder */}
          <div className="p-4 bg-gray-200 rounded-full h-8 w-8" />
          <div>
            {/* Title Placeholder */}
            <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
            {/* Category Placeholder */}
            <div className="h-3 w-16 bg-gray-100 rounded" />
          </div>
        </div>
        {/* Arrow/Chevron Placeholder */}
        <div className="h-5 w-5 bg-gray-100 rounded" />
      </div>
    </div>
  );
}