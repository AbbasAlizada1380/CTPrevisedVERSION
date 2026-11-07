// Sidebar.js (Corrected Role Handling with Financial Dashboard navigation)

import React, { useState } from "react";
import { FaBuilding, FaSignOutAlt, FaChartLine } from "react-icons/fa"; // Import FaChartLine
import { useSelector, useDispatch } from "react-redux";
import { signOutSuccess } from "../../state/userSlice/userSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { LucideUserRoundPlus } from "lucide-react";
import {
  MdOutlineDashboardCustomize,
  MdAddShoppingCart,
  MdPeople,
  MdReceiptLong,
  MdInventory,
  MdFactory,
  MdPayments,
  MdAttachMoney,
  MdBadge,
} from "react-icons/md";

const Sidebar = ({ setActiveComponent }) => {
  const [selectedC, setSelectedC] = useState("home");
  const [activeC, setActiveC] = useState("home");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const MySwal = withReactContent(Swal);

  const handleSignOut = () => {
    MySwal.fire({
      title: "آیا مطمئن هستید؟",
      text: "شما از سیستم خارج خواهید شد!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "بله، خارج شو!",
      cancelButtonText: "لغو",
    }).then((result) => {
      if (result.isConfirmed) {
        dispatch(signOutSuccess());
        navigate("/sign-in");
      }
    });
  };

  const AllComponents = [
    {
      name: "صفحه اصلی",
      value: "home",
      icon: <MdOutlineDashboardCustomize />,
    },
    {
      name: "سفارشات جدید",
      value: "Orders",
      icon: <MdAddShoppingCart />,
    },
    {
      name: "مشتری ها",
      value: "Customers",
      icon: <MdPeople />,
    },
    {
      name: "رسید ها",
      value: "Receipt",
      icon: <MdReceiptLong />,
    },
    {
      name: "گدام",
      value: "Stock",
      icon: <MdInventory />,
    },
    {
      name: "گدام کارخانه",
      value: "CompanyStock",
      icon: <MdFactory />,
    },
    {
      name: "مصارف",
      value: "ExpenseManager",
      icon: <MdPayments />,
    },
    {
      name: "برداشت",
      value: "Money",
      icon: <MdAttachMoney />,
    },
    {
      name: "فروشنده ها",
      value: "Sellers",
      icon: <MdBadge />,
    },
    {
      name: "کارمندان",
      value: "StaffManager",
      icon: <MdBadge />,
    },
    {
      name: "معاشات",
      value: "SalaryManagement",
      icon: <MdPayments />,
    },
    {
      name: "داشبورد مالی",          // New item
      value: "financialDashboard",    // Value used for navigation
      icon: <FaChartLine />,
    },
    {
      name: "ثبت کاربر جدید",
      value: "AddUser",
      icon: <LucideUserRoundPlus />,
    },
    {
      name: "خروج",
      value: "signout",
      icon: <FaSignOutAlt />,
    },
  ];

  let accessibleComponents = [];

  if (currentUser && currentUser.role) {
    const userRole = currentUser.role;

    if (userRole === "admin") {
      // Admin sees all components
      accessibleComponents = AllComponents;
    } else if (userRole === "designer") {
      // Designer only sees Orders and Customers (plus signout for usability)
      const designerAllowedValues = ["home","Orders", "Customers", "signout"];
      accessibleComponents = AllComponents.filter((component) =>
        designerAllowedValues.includes(component.value)
      );
    } else {
      accessibleComponents = AllComponents.filter(
        (component) => component.value === "signout"
      );
    }
  } else {
    accessibleComponents = AllComponents.filter(
      (component) =>
        component.value === "Orders" || component.value === "signout"
    );
  }

  return (
    <div
      className={`h-full transition-all duration-300 ease-in-out w-64 bg-cyan-800 overflow-y-hidden `}
    >
      <header className="flex items-center gap-5 p-5 text-white font-bold text-xl">
        <div className="flex items-center justify-center p-1 bg-white rounded-full">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full" />
        </div>
        <span className="text-lg font-semibold text-white whitespace-nowrap">
          غرب سی تی پی
        </span>
      </header>

      <ul className="mr-1 px-3">
        {accessibleComponents.map((component, index) => (
          <li key={index} className="relative group cursor-pointer">
            {component.value === "signout" ? (
              <a
                onClick={handleSignOut}
                className={`relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md
                ${activeC === component.value
                    ? "bg-white text-gray-800"
                    : "hover:bg-white hover:bg-opacity-20 text-white hover:text-black"
                  }`}
              >
                <span className="text-xl">{component.icon}</span>
                <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                  {component.name}
                </span>
              </a>
            ) : component.value === "financialDashboard" ? (
              // New navigation item for financial dashboard
              <a
                onClick={() => {
                  navigate("/financialdashboard");
                  setSelectedC(component.value);
                  setActiveC(component.value);
                }}
                onMouseEnter={() => setActiveC(component.value)}
                onMouseLeave={() => setActiveC(selectedC)}
                className={`relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md
                ${activeC === component.value
                    ? "bg-white text-gray-800"
                    : "hover:bg-red-500  text-white"
                  }`}
              >
                <span className="text-xl">{component.icon}</span>
                <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                  {component.name}
                </span>
              </a>
            ) : (
              <a
                onClick={() => {
                  setActiveComponent(component.value);
                  setSelectedC(component.value);
                  setActiveC(component.value);
                }}
                onMouseEnter={() => setActiveC(component.value)}
                onMouseLeave={() => setActiveC(selectedC)}
                className={`relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md
                ${activeC === component.value
                    ? "bg-white text-gray-800"
                    : "hover:bg-white hover:bg-opacity-20 text-white"
                  }`}
              >
                <span className="text-xl">{component.icon}</span>
                <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                  {component.name}
                </span>
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;