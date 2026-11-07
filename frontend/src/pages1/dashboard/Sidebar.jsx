import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { signOutSuccess } from "../../state/userSlice/userSlice";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import {
  FaHome,
  FaChartPie,
  FaSignOutAlt,
} from "react-icons/fa";
import {
  MdKeyboardArrowDown,
  MdOutlineAssessment,
  MdOutlineDashboardCustomize,
} from "react-icons/md";
import { PiUsersThree } from "react-icons/pi";
import { GiTakeMyMoney } from "react-icons/gi";
import { BiSolidReport } from "react-icons/bi";

const Sidebar = ({ setActiveComponent }) => {
  const [selectedC, setSelectedC] = useState("dashboard");
  const [openReportsMenu, setOpenReportsMenu] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.user);
  const MySwal = withReactContent(Swal);

  // Handle dropdown toggle
  const handleDropdownToggle = () => {
    setOpenReportsMenu(!openReportsMenu);
  };

  // Handle main menu selection (internal component switch)
  const handleComponentSelect = (componentValue) => {
    setSelectedC(componentValue);
    setActiveComponent(componentValue);
    setOpenReportsMenu(false);
  };

  // Handle sub‑item click (reports)
  const handleSubItemClick = (componentValue) => {
    setSelectedC(componentValue);
    setActiveComponent(componentValue);
    setOpenReportsMenu(true);
  };

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

  // Define all menu items (with role‑based access later)
  const AllComponents = [
    // Main loan management dashboard
    {
      name: "داشبورد اصلی",
      value: "dashboard",
      icon: <FaHome />,
      role: ["admin", "reception"],
    },
    {
      name: "مدیریت کارمندان",
      value: "employees",
      icon: <PiUsersThree />,
      role: ["admin", "reception"],
    },
    {
      name: "مدیریت قرضه‌ها",
      value: "loans",
      icon: <GiTakeMyMoney />,
      role: ["admin", "reception"],
    },
    // Reports dropdown (special handling)
    {
      name: "گزارش‌ها",
      value: "reports", // not a real component, used for dropdown
      icon: <BiSolidReport />,
      role: ["admin", "reception"],
      isDropdown: true,
    },
    // Financial dashboard (navigates to /dashboard)
    {
      name: "داشبورد مدیریت",
      value: "financialDashboard",
      icon: <MdOutlineDashboardCustomize />,
      role: ["admin", "reception"],
      isNavigate: true,
    },
    {
      name: "خروج",
      value: "signout",
      icon: <FaSignOutAlt />,
      role: ["admin", "reception"],
      isSignOut: true,
    },
  ];

  // Report sub‑items
  const reportItems = [
    {
      name: "گزارش کلی شرکت",
      value: "companyReport",
      icon: <MdOutlineAssessment />,
    },
    {
      name: "گزارش کارمندان",
      value: "employeeReport",
      icon: <FaChartPie />,
    },
  ];

  // Role‑based filtering
  let accessibleComponents = [];
  if (currentUser && currentUser.role) {
    const userRole = currentUser.role;
    accessibleComponents = AllComponents.filter((component) =>
      component.role.includes(userRole)
    );
  } else {
    // Fallback for unauthenticated users (show nothing but signout maybe)
    accessibleComponents = AllComponents.filter(
      (component) => component.value === "signout"
    );
  }

  return (
    <div className="h-full transition-all duration-300 ease-in-out w-64 bg-cyan-800 overflow-y-hidden">
      <header className="flex items-center gap-5 p-5 text-white font-bold text-xl">
        <div className="flex items-center justify-center p-1 bg-white rounded-full">
          <img src="/logo.png" alt="Logo" className="h-8 w-8 rounded-full" />
        </div>
        <span className="text-lg font-semibold text-white whitespace-nowrap">
          غرب سی تی پی
        </span>
      </header>

      <ul className="mr-1 px-3">
        {accessibleComponents.map((component, index) => {
          // Handle sign‑out
          if (component.value === "signout") {
            return (
              <li key={index} className="relative group cursor-pointer">
                <a
                  onClick={handleSignOut}
                  className="relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md hover:bg-white hover:bg-opacity-20 text-white hover:text-black"
                >
                  <span className="text-xl">{component.icon}</span>
                  <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                    {component.name}
                  </span>
                </a>
              </li>
            );
          }

          // Handle financial dashboard navigation
          if (component.isNavigate) {
            return (
              <li key={index} className="relative group cursor-pointer">
                <a
                  onClick={() => navigate("/dashboard")}
                  className="relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md hover:bg-white hover:bg-opacity-20 text-white hover:text-black"
                >
                  <span className="text-xl">{component.icon}</span>
                  <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                    {component.name}
                  </span>
                </a>
              </li>
            );
          }

          // Handle reports dropdown
          if (component.isDropdown) {
            return (
              <li key={index} className="relative group cursor-pointer">
                <div>
                  <a
                    onClick={handleDropdownToggle}
                    className={`relative flex items-center justify-between w-full px-6 py-3 transition-all duration-300 rounded-md ${openReportsMenu
                        ? "bg-white text-gray-800"
                        : "hover:bg-white hover:text-black hover:bg-opacity-20 text-white"
                      }`}
                  >
                    <div className="flex items-center">
                      <span className="text-xl">{component.icon}</span>
                      <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                        {component.name}
                      </span>
                    </div>
                    <MdKeyboardArrowDown
                      size={20}
                      className={`transition-transform duration-300 ${openReportsMenu ? "rotate-180" : ""
                        }`}
                    />
                  </a>

                  {/* Reports Sub Menu */}
                  {openReportsMenu && (
                    <ul className="mt-1 mr-6 space-y-1 border-r-2 border-white pr-2">
                      {reportItems.map((report, idx) => (
                        <li key={idx}>
                          <a
                            onClick={() => handleSubItemClick(report.value)}
                            className={`relative flex items-center w-full px-6 py-2 text-sm rounded-md transition-all duration-300 ${selectedC === report.value
                                ? "bg-white text-black"
                                : "text-gray-200 hover:bg-white hover:bg-opacity-20 hover:text-black"
                              }`}
                          >
                            <span className="text-base">{report.icon}</span>
                            <span className="mr-4 whitespace-nowrap">
                              {report.name}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            );
          }

          // Normal main menu items
          return (
            <li key={index} className="relative group cursor-pointer">
              <a
                onClick={() => handleComponentSelect(component.value)}
                onMouseEnter={() => { }}
                onMouseLeave={() => { }}
                className={`relative flex items-center w-full px-6 py-3 transition-all duration-300 rounded-md ${selectedC === component.value
                    ? "bg-white text-gray-800"
                    : "hover:bg-white hover:bg-opacity-20 text-white hover:text-black"
                  }`}
              >
                <span className="text-xl">{component.icon}</span>
                <span className="mr-4 text-lg font-semibold whitespace-nowrap">
                  {component.name}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Sidebar;