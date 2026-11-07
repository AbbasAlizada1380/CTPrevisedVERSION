import React from "react";

const SellerTableSkeleton = ({ rows = 12 }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse border-b border-gray-200">
          <td className="px-5 py-3">
            <div className="h-4 w-6 bg-gray-300 rounded" />
          </td>

          <td className="px-5 py-3">
            <div className="h-4 w-28 bg-gray-300 rounded mb-1" />
            <div className="h-3 w-20 bg-gray-200 rounded" />
          </td>

          <td className="px-5 py-3">
            <div className="h-4 w-32 bg-gray-300 rounded" />
          </td>

          <td className="px-5 py-3">
            <div className="h-4 w-24 bg-gray-300 rounded" />
          </td>

          <td className="px-5 py-3">
            <div className="h-4 w-16 bg-gray-300 rounded-full" />
          </td>

          <td className="px-5 py-3">
            <div className="h-4 w-24 bg-gray-300 rounded" />
          </td>

          <td className="px-5 py-3 text-center">
            <div className="h-8 w-28 bg-gray-300 rounded-md mx-auto" />
          </td>
        </tr>
      ))}
    </>
  );
};

export default SellerTableSkeleton;
