export default function Loading() {
  return (
    <div className="flex items-center justify-center w-full h-full py-10">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
        <p className="mt-3 text-gray-600 text-sm">در حال بارگذاری...</p>
      </div>
    </div>
  );
}
