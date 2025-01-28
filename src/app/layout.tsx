import { NavBar, PageNav } from "../Components";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Web3bridge",
  description: "Web3bridge is one of the best platform for learning web3",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`flex  ${inter.className}`}>
        <div className="lg:w-1/6 lg:h-full  md:h-[1020px] h-[900px]">
          <NavBar />
        </div>
        <div className="flex  w-full lg:w-5/6 p-2 items-center justify-center">
          <div className="flex h-full w-full overflow-hidden   bg-white rounded-lg flex-col text-black">
            {children}
            {/* <PageNav pageTitle=""/>
            <div className="flex w-full h-full justify-center items-cente rounded-lg p-2">
            </div> */}
          </div>
        </div>
      </body>
    </html>
  );
}
