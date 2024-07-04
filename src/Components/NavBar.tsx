import Link from "next/link"
import { NavItems } from "../Components"

import Image from "next/image"
import Logo from "../../public/Web3LagosSvg/Group 562.svg"
import home from "../../public/Web3LagosSvg/home-icon.svg"
import person from "../../public/Web3LagosSvg/icon-1.svg"
import setting from "../../public/Web3LagosSvg/icon-6.svg"

const NavBar = () => {

  return (
    <div className='h-screen w-1/5 bg-[#181A1C] text-white flex flex-col justify-between pt-4 p-2'>
      <div className="flex flex-col w-full space-y-5">
        <Link href="/" className="flex items-center gap-3 p-4">
          <Image src={Logo} alt="Web3Bridge Logo" />
          <h4 className="text-[21px]">Web3lagos Event</h4>
        </Link>
        <div className="flex flex-col w-full gap-2">
          <NavItems href="/Web3Lagos/Dashboard" src={home} name="Dashboard" />
          <NavItems href="/Web3Lagos/Participants" src={person} name="Participants" />
          <NavItems href="#" src={setting} name="Settings" />
        </div>
      </div>
      <div className="border-t-[1px] border-[#1D2739] p-3">

      </div>
    </div>
  )
}

export default NavBar