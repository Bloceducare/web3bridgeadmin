"use client"

import Image from "next/image";
import { useState, useEffect } from "react";
import { Inter } from "next/font/google";
// import "./globals.css";

import avatar from "../../../public/Web3LagosSvg/button-icon.png";
import downArror from "../../../public/Web3LagosSvg/icon.svg";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });


export default function RootLayout({

  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleDropdown = () => {
    setDropdownOpen((prev) => !prev);
  };

  const [user, setUser] = useState<null | { name: string; email: string; role: string; username: string }>(null);


  // Close the dropdown if the user clicks outside of it
  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const storedUser = JSON.parse(userString); 
      setUser(storedUser); 
    }



    const handleClickOutside = (event: MouseEvent) => {
      const dropdownElement = document.getElementById("dropdownMenu");
      const downArrowElement = document.getElementById("downArrow");

      if (
        dropdownElement &&
        downArrowElement &&
        !dropdownElement.contains(event.target as Node) &&
        !downArrowElement.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  

  return (
    <div className="w-full h-full flex flex-col items-center overflow-hidden">
      <div className="w-full px-5 py-4 border-b-[1px] border-[#F0F2F5] flex justify-between items-center gap-x-4 pr-10">
        <p className="text-3xl font-light">
          Welcome <b>{user?.name}</b>
        </p>
        <div className="flex gap-x-4 items-center relative">
          {/* Avatar Image */}
          <Image src={avatar} alt="avatar" className="w-[38px]" />
          
          {/* Down Arrow for Dropdown */}
          <div
            id="downArrow"
            className="cursor-pointer"
            onClick={toggleDropdown}
          >
            <Image src={downArror} alt="down arrow" className="w-[18px]" />
          </div>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              id="dropdownMenu"
              className="absolute top-[60px] right-0 bg-white shadow-lg rounded-md w-48 border border-gray-200 z-10"
            >
              <ul className="flex flex-col py-2">
                {/* All Courses Link */}
                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                  <Link href="/Web3Lagos/Dashboard" className="block">
                    All Courses
                  </Link>
                </li>

                {/* Open Courses Link */}
                <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                  <Link href="/Web3Lagos/Dashboard/OpenCourse" className="block">
                    Open Courses
                  </Link>
                </li>

                    {/* Open Courses Link */}
                    <li className="px-4 py-2 text-sm cursor-pointer hover:bg-gray-100">
                  <Link href="/Web3Lagos/Dashboard/SendEmail" className="block">
                    Send Emails
                  </Link>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Render Child Components */}
      {children}
    </div>
  );
}

