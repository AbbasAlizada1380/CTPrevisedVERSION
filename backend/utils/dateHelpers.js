// utils/dateHelpers.js
import moment from "moment-jalaali";

moment.loadPersian({ usePersianDigits: false, dialect: "persian-modern" });

export const getDaysInMonth = (year, month) => {
  // month در اینجا 1-12 است (فروردین=1، حمل=1)
  return moment.jDaysInMonth(year, month - 1);
};

export const calculateDailyRate = (monthlySalary, daysInMonth) => {
  return monthlySalary / daysInMonth;
};

export const getMonthName = (month, language = "fa") => {
  const names = {
    fa: [
      "حمل",
      "ثور",
      "جوزا",
      "سرطان",
      "اسد",
      "سنبله",
      "میزان",
      "عقرب",
      "قوس",
      "جدی",
      "دلو",
      "حوت",
    ],
    en: [
      "Hamal",
      "Saur",
      "Jawza",
      "Saratan",
      "Asad",
      "Sunbula",
      "Mizan",
      "Aqrab",
      "Qaws",
      "Jadi",
      "Dalw",
      "Hut",
    ],
  };
  return names[language][month - 1];
};

export const getYearMonths = (year) => {
  const months = [];
  for (let i = 1; i <= 12; i++) {
    months.push({
      month: i,
      name: getMonthName(i),
      days: getDaysInMonth(year, i),
    });
  }
  return months;
};
