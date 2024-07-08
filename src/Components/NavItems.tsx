// import React from "react"
import Link from "next/link"
import Image from "next/image"

type navProps = {
    href: string;
    src: string;
    name: string;
    textStyle: string;
    linkStyle: string;
}

const NavItems:React.FC<navProps> = ({href, src, name, textStyle, linkStyle}) => (
    <Link href={href} className={`flex items-center gap-3 p-3 pl-4 rounded-md ${linkStyle}`}>
    <Image src={src} alt={name} />
    <h4 className={`text-[18px] ${textStyle}`}>{name}</h4>
    </Link>
)

export default NavItems