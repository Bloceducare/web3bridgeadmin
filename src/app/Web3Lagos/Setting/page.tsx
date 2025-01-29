"use client"

import React, { useEffect, useState } from 'react'
import { fetchAllDiscount, deleteCode } from '@/hooks/discount'
import { motion, AnimatePresence } from "framer-motion"
import { Trash2 } from 'lucide-react'
import { BeatLoader } from 'react-spinners'

interface DiscountCodes {
  id: number,
  code: string,
  is_used: boolean,
  validity: string,
 claimant: string
}

function page() {
    const [discountCodes, setDiscountCodes] = useState<DiscountCodes[]>([])
    const [error, setError] = useState<string | null>(null);
    const [showAllDiscount, setShowAllDiscount] = useState(false);
        const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
    const [token, setToken] = useState("")
     const [loading, setLoading] = useState<{
                      delete: { [key: number]: boolean }; 
                      other: boolean; 
                      add: boolean;
                      view:{ [key: number]: boolean };
                    }>({
                      delete: {}, 
                      other: false,
                      add: false,
                      view: {}
                    });
                    const [searchQuery, setSearchQuery] = useState("");


     useEffect(() => {
             const token = localStorage.getItem("token") || "";
             setToken(token)
             fetchAllDiscount(token,  setDiscountCodes, setError, setLoading);
   }, []);

     const handleDelete = async (id: number) => {
                    setLoading((prev) => ({
                      ...prev,
                      delete: {
                        ...prev.delete,
                        [id]: true, 
                      },
                    }));
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
                      setLoading((prev) => ({
                        ...prev,
                        delete: {
                          ...prev.delete,
                          [id]: false, 
                        },
                      }));
                    }
                  };

   const filteredDiscounts = discountCodes.filter(
    (discount) =>
      discount.code.toLowerCase().includes(searchQuery.toLowerCase())  );
                   



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
                    <button className='border px-4 py-3 bg-white rounded-lg'>Verify Discount</button>

                    <button 
              onClick={() => setShowAllDiscount(true)}
              className="border px-4 py-3 bg-white rounded-lg hover:bg-gray-100 transition"
            >
              All Discount
            </button>
                    <button className='border px-4 py-3 bg-white rounded-lg'>Create Discount code</button>
                </div>



                {/* Overlay */}
                {showAllDiscount && (
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
                className="fixed top-[10%]  transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-20"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">All Discount Codes</h2>
                  <button
                    onClick={() => setShowAllDiscount(false)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>

                {/* Search Bar */}
                <input
                  type="text"
                  placeholder="Search by code...."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md mb-4"
                />

                {/* Discount Codes List */}
                <div className="max-h-[70vh] overflow-y-auto space-y-3">
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
          </AnimatePresence>
            </section>
        </section>




    </div>
  )
}

export default page