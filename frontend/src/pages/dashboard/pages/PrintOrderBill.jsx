import React, { useEffect, useRef } from "react";
import jalaali from "jalaali-js";
import VazirmatnTTF from "../../../../public/ttf/Vazirmatn.js";

const PrintOrderBill = ({ isOpen, onClose, order, autoPrint }) => {
  const hasPrinted = useRef(false);

  useEffect(() => {
    if (autoPrint && isOpen && order && !hasPrinted.current) {
      hasPrinted.current = true;
      setTimeout(() => window.print(), 500);
    }
    if (!isOpen) hasPrinted.current = false;
  }, [autoPrint, isOpen, order]);

  if (!isOpen || !order) return null;

  const customer = order.Customer || {};

  // تبدیل عدد به حروف دری افغانستان
  const convertNumberToPersianWords = (num) => {
    const number = Math.abs(parseFloat(num) || 0);
    if (number === 0) return "صفر";

    const units = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const hundreds = ['', 'صد', 'دوصد', 'سه صد', 'چهارصد', 'پنجصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];

    const largeNumbers = [
      { value: 1000000000, word: 'میلیارد' },
      { value: 1000000, word: 'میلیون' },
      { value: 1000, word: 'هزار' }
    ];

    const convertThreeDigit = (n) => {
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;

      let words = '';
      if (hundred > 0) words += hundreds[hundred] + ' و ';
      if (remainder === 0) return words.slice(0, -3);
      if (ten === 1) words += teens[unit];
      else {
        if (ten > 1) {
          words += tens[ten];
          if (unit > 0) words += ' و ';
        }
        if (unit > 0) words += units[unit];
      }
      return words.trim();
    };

    let result = '';
    let remaining = Math.floor(number);
    for (const large of largeNumbers) {
      if (remaining >= large.value) {
        const count = Math.floor(remaining / large.value);
        result += convertThreeDigit(count) + ' ' + large.word + ' و ';
        remaining %= large.value;
      }
    }
    if (remaining > 0) result += convertThreeDigit(remaining);
    else result = result.slice(0, -3);

    const decimal = Math.round((number - Math.floor(number)) * 100);
    if (decimal > 0) result += ' و ' + convertThreeDigit(decimal) + ' پول خرد';
    return result.trim() + (result ? ' افغانی' : '');
  };

  const formatToJalali = (dateString) => {
    const d = new Date(dateString);
    const { jy, jm, jd } = jalaali.toJalaali(
      d.getFullYear(),
      d.getMonth() + 1,
      d.getDate()
    );
    return `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
  };

  const receiptNo = order.id?.toString().padStart(6, "0") || "------";

  return (
    <>
      {/* Main Component - Always visible when isOpen is true */}
      <div className={`fixed inset-0 ${isOpen ? 'flex' : 'hidden'} items-center justify-center z-50 bg-black/70 p-4`}>

        <div className="print-root">

          <div
            id="printable-area"
            className="bg-white text-black p-8 shadow-2xl border border-gray-200"
            style={{
              direction: "rtl",
              fontFamily: "'Vazirmatn', 'Tahoma', 'Segoe UI', Arial, sans-serif",
              margin: "0 auto",
              borderRadius: "8px",
              background: "linear-gradient(to bottom, #ffffff, #f9fafb)"
            }}
          >
            {/* Decorative Border */}
            <div className="absolute inset-0 border-2 border-blue-100 pointer-events-none rounded-lg"></div>

            {/* Header */}
            <div className="relative flex justify-between items-start mb-6 border-b-2 border-blue-200 pb-4">
              {/* Left: Office Info */}
              <div className="text-right">
                <h1 className="text-2xl font-bold text-blue-900 mb-2 tracking-tight">رسید پرداخت رسمی</h1>
                <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-3 rounded-lg inline-block">
                  <p className="text-lg font-semibold text-gray-800">دفتر غرب CTP</p>
                  <p className="text-gray-600 text-sm mt-1">کابل - افغانستان</p>
                </div>
              </div>

              {/* Center: Logo */}
              <div className="absolute left-1/2 transform -translate-x-1/2 top-0">
                <div className="w-32 h-32 flex items-center justify-center bg-blue-50 rounded-full">
                  <img src="logo.png" alt="" />
                </div>
              </div>

              {/* Right: Receipt Info */}
              <div className="text-left border-l-2 border-gray-300 pl-3 bg-gray-50 p-3 rounded-lg">
                <p className="text-sm mb-1">
                  <strong className="text-gray-700">شماره رسید:</strong>
                  <span className="text-red-600 font-bold text-base mr-1">{receiptNo}</span>
                </p>
                <p className="text-sm mb-1">
                  <strong className="text-gray-700">تاریخ صدور:</strong>
                  <span className="text-green-700 font-semibold">{formatToJalali(order.createdAt)}</span>
                </p>
                <p className="text-sm">
                  <strong className="text-gray-700">زمان:</strong>
                  <span className="text-purple-700 font-semibold">
                    {new Date(order.createdAt).toLocaleTimeString("en-GB")}
                  </span>
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="text-sm leading-8 mt-6 p-5 border-2 border-gray-200  rounded-lg shadow-sm">
              <p className="text-sm text-justify bg-white p-4 rounded border border-gray-100">
                آقای/مطبعه
                <span className="font-bold text-md"> {order.Customer.fullname || "................"} </span>

                با شماره ثبت
                <span className=" mx-1 px-2 py-1 rounded">
                  {customer.id || "................"}
                </span>
                مبلغ
                <strong className="text-green-700 mx-1 px-2 py-1 rounded">
                  {order.amount
                    ? Number(order.amount).toLocaleString("en-US")
                    : "................"}{" "}
                  افغانی
                </strong>
                (به حروف:
                <strong className=" mx-1 px-2 py-1  rounded">
                  {convertNumberToPersianWords(order.amount) || "................"}
                </strong>)
                را در تاریخ
                <strong className=" mx-1 px-2 py-1 rounded">
                  {formatToJalali(order.createdAt) || "................"}
                </strong>
                به دفتر <strong className="">CTP غرب</strong> بابت کرایه پلیت های کشیده شده شان پرداخت نمود.
              </p>
            </div>

            {/* Footer & Signatures */}
            <div className="flex justify-between items-start mt-6">
              {/* Payment Receiver */}
              <div className="text-center w-1/3 px-2">
                <div className="h-16 w-full border-b-2 border-dashed border-gray-400 mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">امضاء اینجا قرار گیرد</span>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-2 rounded border border-gray-200">
                  <p className="text-sm font-bold text-gray-800">امضای دریافت‌کننده</p>
                  <p className="text-gray-600 text-xs">(مسئول دفتر غرب CTP)</p>
                </div>
              </div>

              {/* System Confirmation */}
              <div className="text-center w-1/3 px-2">
                <div className="h-16 w-full flex items-center justify-center border-2 border-dashed border-blue-300 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-sm">
                  <p className="text-sm font-bold text-blue-800 flex items-center gap-1">
                    <span className="text-lg">📋</span>
                    مهر و امضای سیستم
                  </p>
                </div>
                <div className="mt-2 bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded border border-blue-100">
                  <p className="text-xs font-bold text-gray-800">صادر شده توسط سیستم اتوماتیک اداری</p>
                  <p className="text-xs text-gray-600 mt-1">نمبر رسید:
                    <span className="font-bold text-blue-700"> SYS-{receiptNo}</span>
                  </p>
                </div>
              </div>

              {/* Payer */}
              <div className="text-center w-1/3 px-2">
                <div className="h-16 w-full border-b-2 border-dashed border-gray-400 mb-2 flex items-center justify-center">
                  <span className="text-gray-400 text-xs">امضاء اینجا قرار گیرد</span>
                </div>
                <div className="bg-gradient-to-r from-gray-50 to-white p-2 rounded border border-gray-200">
                  <p className="text-sm font-bold text-gray-800">امضای پرداخت‌کننده</p>
                  <p className="text-gray-600 text-xs">({customer.fullname || "................"})</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="fixed bottom-6 left-6 flex gap-4 p-4 rounded-xl">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-red-500 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-semibold"
          >
            بستن
          </button>

          <button
            onClick={() => window.print()}
            className="px-8 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-700 transition-all duration-200 shadow-md hover:shadow-lg font-semibold flex items-center gap-2"
          >
            <span className="text-lg"> </span> چاپ  کردن
          </button>
        </div>

      </div>

      {/* Print-specific styles */}
      <style jsx global>{`
@font-face {
  font-family: 'Vazirmatn';
  src: url(${VazirmatnTTF}) format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

@media print {
  html, body {
    width: 100%;
    height: 100%;
    margin: 0 !important;
    padding: 0 !important;
  }

  body {
    background: white !important;
  }

  body * {
    visibility: hidden !important;
  }

  .print-root,
  .print-root * {
    visibility: visible !important;
  }

  .print-root {
    position: fixed !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    display: block !important;
  }

  #printable-area {
    width: 100% !important;
    height: 100% !important;
    padding: 10mm !important;
    box-sizing: border-box !important;
    margin: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    transform: none !important;
    font-family: 'Vazirmatn', 'Tahoma', 'Segoe UI', Arial, sans-serif !important;
  }

  button,
  .no-print {
    display: none !important;
  }

  @page {
    size: A5 landscape;
    margin: 0;
  }

  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}

`}</style>

    </>
  );
};

export default PrintOrderBill;