"use client"

import React, { useEffect, useState } from 'react'
import { fetchAllDiscount, deleteCode, generateDiscountCode, validateDiscountCode } from '@/hooks/discount'
import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from 'lucide-react'
import { BeatLoader } from 'react-spinners'

interface DiscountCodes {
  id: number,
  code: string,
  is_used: boolean,
  validity: string,
 claimant: string
 created_at: string
}

interface newCode {
  id: number,
  code: string,
  is_used: boolean,
  validity: string,
  claimant: string
}

function page() {
  const [discountCodes, setDiscountCodes] = useState<DiscountCodes[]>([])
  const [newDiscountCode, setNewDiscountCode] = useState<newCode[]>([])
  const [error, setError] = useState<string | null>(null);
  const [showAllDiscount, setShowAllDiscount] = useState(false);
  const [showCreateDiscount, setShowCreateDiscount] = useState(false);
  const [validate, setValidateDiscount] = useState(false)
  const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(0); 
  const [code, setCode] = useState("")
  const [message, setMessage] = useState<string>(""); 
  const [Valmessage, setValMessage] = useState<string>(""); 
  const [filterDate, setFilterDate] = useState("");
  const [filterTime, setFilterTime] = useState("");


  const [OpenOverlay, setOpenOverlay] = useState(false);
  const [token, setToken] = useState("")
  const [loading, setLoading] = useState<{
          delete: { [key: number]: boolean }; 
          other: boolean; 
          add: boolean;
          new: boolean;
          validate: boolean,
          view:{ [key: number]: boolean };
        }>({
          delete: {}, 
          other: false,
          add: false,
          new: false,
          validate: false,
          view: {}
        });
  const [searchQuery, setSearchQuery] = useState("");


     useEffect(() => {
             const token = localStorage.getItem("token") || "";
             setToken(token)
             fetchAllDiscount(token,  setDiscountCodes, setError, setLoading);
   }, []);

     const handleDelete = async (id: number) => {
      setLoading((prev) => ({  ...prev,  delete: {...prev.delete,  [id]: true,  }, }));
      try {
        await deleteCode(id, token, (message: string) => {
          setDelMessage((prev) => ({
            ...prev,
            [id]: message,
          }));
        });
    
        if (token) {
          fetchAllDiscount(token,  setDiscountCodes, setError, setLoading);
        }
      } catch (error) {
        console.error("Error deleting the course:", error);
        setDelMessage((prev) => ({
          ...prev,
          [id]: "An error occurred while deleting the course.",
        }));
      } finally {
        setLoading((prev) => ({...prev, delete: {...prev.delete, [id]: false, }, }));
      }
    };
    const handleGenerateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      if (quantity < 1) {
        setMessage("Please enter a valid quantity (minimum 1).");
        return;
      }
  
      await generateDiscountCode(quantity, token, setNewDiscountCode, setMessage, setLoading);
    };

    const handleValidateDiscount = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      if (!code.trim()) {
        setValMessage("Please enter a Code");
        return;
      }
  
      await validateDiscountCode(code, token,  setValMessage, setLoading);
    };

    const [filterOption, setFilterOption] = useState("all"); 
    const filteredDiscounts = discountCodes.filter((discount) => {
      const matchesSearch = discount.code.toLowerCase().includes(searchQuery.toLowerCase());
  
      const discountDate = new Date(discount.created_at).toISOString().split("T")[0]; 
      const discountTime = new Date(discount.created_at).toISOString().split("T")[1].slice(0, 5); 
  
      const matchesFilter =
          filterOption === "all" ||
          (filterOption === "used" && discount.is_used) ||
          (filterOption === "unused" && !discount.is_used);
  
      const matchesDate = filterDate ? discountDate === filterDate : true;
  
      const matchesTime = filterTime ? discountTime === filterTime : true;
  
      return matchesSearch && matchesFilter && matchesDate && matchesTime;
  });
  
       const toggleAllDiscount = () => {
      setShowAllDiscount((prev) => !prev);
      setOpenOverlay((prev) => !prev);
    };
    const toggleCreateDiscount = () => {
    setShowCreateDiscount((prev) => !prev);
   setOpenOverlay((prev) => !prev);
    }

    const toggleValidateDiscount = () => {
      setValidateDiscount((prev) => !prev)
      setOpenOverlay((prev) => !prev);
    }

    const handleCopyFilteredCodes = () => {
      const filteredCodes = filteredDiscounts.map((discount) => discount.code).join("\n");
    
      if (filteredCodes) {
        navigator.clipboard.writeText(filteredCodes);
        alert("Filtered discount codes copied to clipboard!");
      } else {
        alert("No matching discount codes available.");
      }
    };
    
                   
  return (
    <div className="bg-green-200 w-full  h-[200vh] p-10">

      <section>
          <div className="flex justify-between items-center mt-2">
              <div className="flex items-center">
                  <h1 className="text-2xl font-bold">Settings</h1>
              </div>
          </div>


      <section className='mt-5'>
          <div className='flex gap-5 items-center'>
                  <button  className="border px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition"  onClick={toggleValidateDiscount}>Verify Discount</button>
                  <button   onClick={toggleAllDiscount} className="border px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition"  >   All Discount    </button>
                  <button   className="border px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition" onClick={toggleCreateDiscount}>Create Discount code</button>
          </div>



          {/* Overlay */}
          {OpenOverlay && (
                  <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-10"
                  onClick={() => setShowAllDiscount(false)}
                  />
              )}


                 {/* Discount Modal */}
     {/* Discount Modal with Scrolling Up Effect */}
     <AnimatePresence>
            {showAllDiscount && (
              <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-[10%]  transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-20 overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">All Discount Codes</h2>
                  <button
                    onClick={toggleAllDiscount}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Search Bar */}
                <div className='flex justify-between items-center gap-10'>
                <input
                  type="text"
                  placeholder="Search by code...."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />

                <input
        type="date"
        value={filterDate}
        onChange={(e) => setFilterDate(e.target.value)}
        className="border p-2 rounded-md"
      />

<input 
  type="time" 
  value={filterTime} 
  onChange={(e) => setFilterTime(e.target.value)} 
/>
                </div>
              

                <div className='flex justify-between mt-10'>
                <select
                      value={filterOption}
                      onChange={(e) => setFilterOption(e.target.value)}
                      className="p-2 border border-gray-300 rounded-md"
                    >
                      <option value="all">All</option>
                      <option value="used">Used</option>
                      <option value="unused">Unused</option>
                    </select>

                                  <button
                onClick={handleCopyFilteredCodes}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Copy  Codes
              </button>
                  </div>
                

                {/* Discount Codes List */}
                <div className="max-h-[70vh]  space-y-3 mt-4">
                  {filteredDiscounts.length > 0 ? (
                    filteredDiscounts.map((discount) => (
                      <div
                        key={discount.id}
                        className="p-3 border rounded-lg bg-gray-100"
                      >
                        <p>
                          <strong>Code:</strong> {discount.code}
                        </p>
                        <p>
                          <strong>Used:</strong> {discount.is_used ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Validity:</strong> {discount.validity}
                        </p>
                        <p>
                          <strong>Claimant:</strong> {discount.claimant}
                        </p>
                        <p>
                        <strong>Date Created:</strong> {new Date(discount.created_at).toISOString().split("T")[0]}
                        </p>
                        <p>
                        <strong>Time Created:</strong> {new Date(discount.created_at).toISOString().split("T")[1].slice(0, 5)}
                        </p>
                        <div className='flex justify-end'>
                        <button onClick={() => handleDelete(discount.id)}>{loading.delete[discount.id] ? <BeatLoader size={5} />: <Trash2 /> }</button>
                        </div>

                        {Delmessage[discount.id] && (
                            <div>
                                <p className="text-center ">{Delmessage[discount.id]}</p>
                            </div>
                            )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">No matching discount codes.</p>
                  )}

                </div>
              </motion.div>
            )}



            {/* Create Discount Modal */}
            {showCreateDiscount && (
                <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-[10%]  transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-20"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Generate new codes</h2>
                  <button
                    onClick={toggleCreateDiscount}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Discount Codes List */}
                <h2>Generate discount by specifying how many you want (1, 2, 3.....)</h2>
                <form className='mt-5' onSubmit={handleGenerateDiscount}>
                <div className='flex flex-col gap-2 text-lg font-semibold'>
                    <label>Number of discount codes</label>
                  <input type="number" className='border p-2 outline-none' onChange={(e) => setQuantity(Number(e.target.value))} min={1} />
                </div>

                <button type="submit" className='bg-black text-white px-3 py-2 rounded-md mt-3'>{loading.new ? "Generating..." : "Generate"} </button>
                </form>

                <div className="max-h-[50vh] overflow-y-auto space-y-3">
                  {newDiscountCode.length > 0 ? (
                    newDiscountCode.map((discount) =>(
                      <div key={discount.id}   className="p-3 border rounded-lg bg-gray-100 space-y-2 mt-2">
                           <p>
                          <strong>Code:</strong> {discount.code}
                        </p>
                        <p>
                          <strong>Used:</strong> {discount.is_used ? "Yes" : "No"}
                        </p>
                        <p>
                          <strong>Validity:</strong> {discount.validity}
                        </p>
                        <p>
                          <strong>Claimant:</strong> {discount.claimant}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 mt-5">{error ? "Unable to create Discount code" : "Create Discount code"}</p>
                  ) }
                </div>



                </motion.div>
            )}



            {/* Validate discount */}
            {validate  && (
                <motion.div
                initial={{ opacity: 0, y: 100 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 100 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="fixed top-[10%]  transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-20"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Validate codes</h2>
                  <button
                    onClick={toggleValidateDiscount}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Discount Codes List */}
                <h2>Validate your code</h2>
                <form className='mt-5' onSubmit={handleValidateDiscount}>
                <div className='flex flex-col gap-2 text-lg font-semibold'>
                    <label>Discount code</label>
                  <input type="text" className='border p-2 outline-none' onChange={(e) => setCode((e.target.value))} />
                </div>

                <button type="submit" className='bg-black text-white px-3 py-2 rounded-md mt-3'>{loading.new ? "Validating..." : "Validate"} </button>
                </form>

                <div>
                  {Valmessage &&(
                    <p>{Valmessage}</p>
                  )}
                </div>

                </motion.div>
            )}
          </AnimatePresence>

            </section>


        </section>




    </div>
  )
}

export default page