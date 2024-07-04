// import React from "react"
import Link from "next/link"
import Image from "next/image"

type navProps = {
href: string;
src: string;
name: string;
}

const NavItems:React.FC<navProps> = ({href, src, name}) => (
    <Link href={href} className="flex items-center gap-3 p-3 pl-4 rounded-md hover:bg-[#242529]">
    <Image src={src} alt={name} />
    <h4 className="text-[18px] text-[#d8d8d8] hover:text-white">{name}</h4>
    </Link>
)

export default NavItems