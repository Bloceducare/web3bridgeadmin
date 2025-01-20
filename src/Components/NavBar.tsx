"use client"

import Link from "next/link"
import { NavItems } from "../Components"
import Image from "next/image"
import { useState, useEffect } from "react";


import Logo from "../../public/web3logoLight.svg"
import home from "../../public/Web3LagosSvg/home-icon.svg"
import person from "../../public/Web3LagosSvg/icon-1.svg"
import setting from "../../public/Web3LagosSvg/icon-6.svg"
import avatar from "../../public/Web3LagosSvg/button-icon.png"
import logout from "../../public/Web3LagosSvg/exit.svg"

const NavBar = () => {
  const [user, setUser] = useState<null | { name: string; email: string; role: string; username: string }>(null);

  const logOut = () => {
    const removeItem = localStorage.removeItem("token")
    const removeUser = localStorage.removeItem("user")
    window.location.href="/"
  }

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (userString) {
      const storedUser = JSON.parse(userString); 
      setUser(storedUser); 
    }
  }, []); 

  return (
    <div className='h-full w-full bg-[#181A1C] text-white flex flex-col justify-between '>
      <div className="flex flex-col w-full space-y-5">
        <Link href="/" className="flex items-center gap-3 pt-7 px-3">
          <Image src={Logo} alt="Web3Bridge Logo" />
        </Link>
        <div className="flex flex-col w-full mt-10">
          <NavItems href="/Web3Lagos/Dashboard" src={home} name="Overview" linkStyle="hover:bg-[#242529]" textStyle=" text-[#d8d8d8] hover:text-white" />
          <NavItems href="/Web3Lagos/Participants" src={person} name="Participants" linkStyle="hover:bg-[#242529]" textStyle=" text-[#d8d8d8] hover:text-white" />
          <NavItems href="#" src={setting} name="Settings" linkStyle="hover:bg-[#242529]" textStyle=" text-[#d8d8d8] hover:text-white" />
        </div>
      </div>
      <div className="border-t-[1px] h-[80px] w-full flex justify-between items-center border-[#1D2739] p-3 pb-0">
        <div className="flex w-full gap-2">
          <div className="relative">
          <Image src={avatar} alt="avatar" className="w-[38px]" />
          <div className="absolute h-[10px] w-[10px] border-[1px] border-white bottom-1 right-0 bg-green-700 rounded-full"></div>
          </div>
          <div>
            <h2 className="text-[14px]">{user?.name}</h2>
            <p className="text-[12px] text-[#d8d8d8]">{user?.email}</p>
          </div>
        </div>
        <div onClick={logOut} className="cursor-pointer">
          <Image src={logout} alt="avatar" />
        </div>
      </div>
    </div>
  )
}

export default NavBar