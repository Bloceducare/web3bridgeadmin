
"use client";

import Link from "next/link";
import { NavItems } from "../Components";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Logo from "../../public/web3logoLight.svg";
import home from "../../public/Web3LagosSvg/home-icon.svg";
import person from "../../public/Web3LagosSvg/icon-1.svg";
import setting from "../../public/Web3LagosSvg/icon-6.svg";
import avatar from "../../public/Web3LagosSvg/button-icon.png";
import logout from "../../public/Web3LagosSvg/exit.svg";

const NavBar = () => {
  const [user, setUser] = useState<null | {
    name: string;
    email: string;
    role: string;
    username: string;
  }>(null);
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const logOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const storedUser = JSON.parse(userString);
      setUser(storedUser);
    }
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 lg:hidden"
      >
        {isOpen ? <X className="text-white" /> : <Menu className="text-white" />}
      </button>

      {/* Sidebar Container */}
      <div
        className={`
          fixed inset-y-0 left-0 z-40
          w-54 bg-[#1A1B1F] h-screen overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full justify-between min-h-screen">
          {/* Top Section */}
          <div className="flex flex-col w-full space-y-5">
            <Link href="/" className="flex items-center gap-3 pt-7 px-3">
              <Image src={Logo} alt="Web3Bridge Logo" priority />
            </Link>

            <div className="flex flex-col w-full mt-10">
              <NavItems
                href="/Web3Lagos/Dashboard"
                src={home}
                name="Overview"
                linkStyle="hover:bg-[#242529]"
                textStyle="text-[#d8d8d8] hover:text-white"
              />
              <NavItems
                href="/Web3Lagos/Participants"
                src={person}
                name="Participants"
                linkStyle="hover:bg-[#242529]"
                textStyle="text-[#d8d8d8] hover:text-white"
              />
              <NavItems
                href="/Web3Lagos/Vetting"
                src={person}
                name="Vetting"
                linkStyle="hover:bg-[#242529]"
                textStyle="text-[#d8d8d8] hover:text-white"
              />
              <NavItems
                href="/Web3Lagos/Hub"
                src={setting}
                name="Ethereum Hub"
                linkStyle="hover:bg-[#242529]"
                textStyle="text-[#d8d8d8] hover:text-white"
              />
              <NavItems
                href="/Web3Lagos/Setting"
                src={setting}
                name="Settings"
                linkStyle="hover:bg-[#242529]"
                textStyle="text-[#d8d8d8] hover:text-white"
              />
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t-[1px] p-3 border-[#1D2739] mt-auto">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <div className="relative">
                  <Image src={avatar} alt="avatar" className="w-[38px]" />
                  <div className="absolute h-[10px] w-[10px] border-[1px] border-white bottom-1 right-0 bg-green-700 rounded-full" />
                </div>
                <div className="text-white flex flex-col justify-between">
                  <h2 className="text-[12px]">{user?.name}</h2>
                  <p className="text-[10px] text-[#d8d8d8]">{user?.email}</p>
                </div>
              </div>
              <div onClick={logOut} className="cursor-pointer lg:mb-[1rem]">
                <Image src={logout} alt="logout" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={toggleMenu}
        />
      )}
    </>
  );
};

export default NavBar;