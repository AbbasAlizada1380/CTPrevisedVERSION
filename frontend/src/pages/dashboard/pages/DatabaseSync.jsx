import React, { useState, useRef } from 'react';

const DatabaseSync = () => {
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  // State for Upload
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');

  // State for Download
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.name.endsWith('.sql')) {
        setUploadMessage('❌ Please select a valid .sql file.');
        setSelectedFile(null);
        fileInputRef.current.value = '';
        return;
      }
      setSelectedFile(file);
      setUploadMessage(`📎 Selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('⚠️ Please choose a .sql file first.');
      return;
    }

    setIsUploading(true);
    setUploadMessage('⏳ Uploading and importing to server...');

    const formData = new FormData();
    formData.append('sqlFile', selectedFile);

    try {
      const response = await fetch(`${BASE_URL}/database/import`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Server error (${response.status})`);
      }

      setUploadMessage(`✅ ${result.message}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      console.error('Upload error:', error);
      setUploadMessage(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadMessage('⏳ Generating database backup...');

    try {
      const response = await fetch(`${BASE_URL}/database/export`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      link.download = `database_backup_${dateStr}.sql`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDownloadMessage(`✅ Backup downloaded successfully as ${link.download}!`);
    } catch (error) {
      console.error('Download error:', error);
      setDownloadMessage(`❌ Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className=" bg-white py-8 px-4">
    <div className=" mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cyan-800 mb-2">
            📂 ابزار هم‌گام‌سازی پایگاه داده
          </h1>
          <p className="text-gray-600">
            بارگذاری فایل .sql محلی به سرور یا دریافت پشتیبان از پایگاه داده میزبان
          </p>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-200 rounded-lg shadow-lg p-6 transition-all duration-300 border border-white/20 mb-6">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <svg className="w-6 h-6 text-cyan-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-cyan-800">📤 بارگذاری .sql محلی به سرور میزبان</h2>
          </div>

          <div className="bg-yellow-100 border-r-4 border-yellow-500 text-yellow-700 p-3 mb-4 rounded text-sm font-bold">
            ⚠️ هشدار: این عمل به طور کامل پایگاه داده میزبان را بازنویسی خواهد کرد!
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql"
              onChange={handleFileChange}
              disabled={isUploading}
              className="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-md focus:ring-1 focus:ring-cyan-800 focus:outline-none transition-all duration-200 bg-gray-50 text-right disabled:opacity-50 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
            />
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`bg-cyan-800 text-white py-3 px-7 rounded-xl font-semibold text-lg hover:bg-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                !selectedFile || isUploading ? 'opacity-60' : ''
              }`}
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  در حال بارگذاری...
                </>
              ) : (
                '🚀 بارگذاری به سرور'
              )}
            </button>
          </div>

          {uploadMessage && (
            <p
              className={`mt-4 p-3 rounded border ${
                uploadMessage.includes('✅')
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-red-100 border-red-300 text-red-800'
              }`}
            >
              {uploadMessage}
            </p>
          )}
        </div>

        {/* Download Section */}
        <div className="bg-gray-200 rounded-lg shadow-lg p-6 transition-all duration-300 border border-white/20">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <svg className="w-6 h-6 text-cyan-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-cyan-800">📥 دریافت پشتیبان از پایگاه داده میزبان</h2>
          </div>

          <p className="text-gray-600 text-sm mb-4">
            کل پایگاه داده فعلی را به عنوان یک فایل .sql (ساختار + داده) دانلود می‌کند.
          </p>

          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className={`w-full bg-cyan-800 text-white py-3 px-7 rounded-xl font-semibold text-lg hover:bg-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              isDownloading ? 'opacity-60' : ''
            }`}
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                در حال تولید...
              </>
            ) : (
              '⬇️ دانلود پشتیبان .sql'
            )}
          </button>

          {downloadMessage && (
            <p
              className={`mt-4 p-3 rounded border ${
                downloadMessage.includes('✅')
                  ? 'bg-green-100 border-green-300 text-green-800'
                  : 'bg-red-100 border-red-300 text-red-800'
              }`}
            >
              {downloadMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSync;