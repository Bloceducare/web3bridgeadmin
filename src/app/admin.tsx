import { NavBar, PageNav } from "../Components";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function Admin({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className=" bg-white w-full h-full">
      <div className="w-1/6">
        <NavBar />
        </div>

        <div className="flex h-full w-5/6 p-2 items-center justify-center">
  <div className="flex h-full w-full overflow-hidden   bg-white rounded-lg flex-col items-center text-black">
      {children}
     <PageNav pageTitle=""/>
    <div className="flex w-full h-full justify-center items-cente rounded-lg p-2">
     </div> 
     </div>
   </div>
      </body>
    
    </html>
  );
}




{/* <body className={flex h-[1100px] ${inter.className}}>
<div className="w-1/6">
<NavBar />
</div>
<div className="flex h-full w-5/6 p-2 items-center justify-center">
  <div className="flex h-full w-full overflow-hidden   bg-white rounded-lg flex-col items-center text-black">
      {children}
    {/* <PageNav pageTitle=""/>
    <div className="flex w-full h-full justify-center items-cente rounded-lg p-2">
    // </div> */}
//   </div>
// </div>
// </body> */}





// import { NavBar, PageNav } from "../Components";
// import type { Metadata } from "next";
// import { Inter } from "next/font/google";
// import "./globals.css";
// import Home from "./page";

// const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Web3 Admin",
//   description: "Generated by create next app",
// };

// export default function RootLayout({
//   children,
// }: Readonly<{
//   children: React.ReactNode;
// }>) {
//   return (
//     <html lang="en">
//       <body className=" bg-white w-full h-full">
//         <Home />
//       </body>
    
//     </html>
//   );
// }


