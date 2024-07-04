import Image from "next/image"
import Logo from "../../public/Web3LagosSvg/Group 562.svg"
import Link from "next/link"
// import Employees from "@/app/Pages/Employees/page"

const NavBar = () => {
  return (
    <div className='h-screen w-1/5 bg-[#181A1C] text-white flex flex-col justify-between pt-4 p-2'>
      <div className="flex flex-col w-full space-y-5">
        <Link href="/" className="flex items-center gap-3 p-2">
          <Image src={Logo} alt="Web3Bridge Logo" />
          <h4 className="text-[18px]">Web3lagos Event</h4>
        </Link>
        <div className="flex flex-col w-full">
          <Link href="/Dashboard" className="p-3 rounded-md w-full hover:bg-[#242529]">Dashboard</Link>
          <Link href="/Attendees" className="p-3 rounded-md w-full bg-[#242529] border-[1px] border-[#2D2F31]">Attendees</Link>
        </div>
      </div>
      <div className="border-t-[1px] border-[#1D2739] p-3">

      </div>
    </div>
  )
}

export default NavBar