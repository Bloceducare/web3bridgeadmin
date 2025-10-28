"use client"

import React, { useEffect, useState } from 'react'
import { ScaleLoader } from "react-spinners";
import { Trash2, LockKeyholeOpen,  } from 'lucide-react';
import {BeatLoader} from 'react-spinners';
import { handledeleteProgram, fetchRegistrationData } from '@/hooks/useUpdateProgram';
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/Components/ui/dialog";


interface Registration {
    id: number,
    name: string;
    start_date: string;
    end_date: string;
    registrationFee: string;
    courses: number[];
    cohort: null | string;
}

interface Image {
    id: number;
    picture: string;
}
  
interface Course {
    id: number;
    name: string;
    description: string;
    venue: string[];
    extra_info: string;
    images: Image[]; 
    status: boolean;
    cohort: null | string;
}

type FormData = {
    name: string;
    start_date: string;
    end_date: string;
    registrationFee: string;
    cohort: string;
}

const initialFormState: FormData = {
    name: "",
    start_date: "",
    end_date: "",
    registrationFee: "",
    cohort: "",
};

type FormErrors = {
    [key in keyof FormData]?: string[];
  };

const initialFormErrors: FormErrors = {};

function page() {
      const [registration, setRegistration] = useState<Registration[]>([])
        const [formData, setFormData] = useState<FormData>(initialFormState)
        const [isRegistratinOpen, setIsRegistrationOpen] = useState<{ [key: number]: boolean }>({});
            const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
      const [error, setError] = useState<string | null>(null);
      const [token, setToken] = useState("")
      const [message, setMessage] = useState("");
      const [isNewProgramOpen, setIsNewProgramOpen] = useState<boolean>(false); 
      const [openCourses, setOpenCourse] = useState<boolean>(false)
        const [courses, setCourses] = useState<Course[]>([]);
        const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
      const [loading, setLoading] = useState<{
        delete: { [key: number]: boolean }; 
        other: boolean; 
        add: boolean;
        wait: boolean;
        view:{ [key: number]: boolean };
      }>({
        delete: {}, 
        other: false,
        add: false,
        wait: false,
        view: {}
      }); 

      const [selectedProgram, setSelectedProgram] = useState<Registration | null>(null);
      const [isEditOpen, setIsEditOpen] = useState(false);
      const [editForm, setEditForm] = useState<FormData>(initialFormState);
      const [editErrors, setEditErrors] = useState<FormErrors>(initialFormErrors);
      const [editLoading, setEditLoading] = useState(false);
      const [editMessage, setEditMessage] = useState<string>("");


      useEffect(() => {
        const token = localStorage.getItem("token") || "";
        setToken(token)
        fetchRegistrationData(token,  setRegistration, setIsRegistrationOpen, setError, setLoading);
      }, []);

      const handleCourse = async (id: number[], num: number) => {
              console.log("Fetching courses for IDs:", id);
              setLoading((prev) => ({
                ...prev,
                view: { ...prev.view, [num]: true },
              }));
              setLoading((prev) => ({ ...prev, wait: true }));
              setOpenCourse(true)
              try {
                const results: Course[] = []; 
            
                for (const courseID of id) {
                  const response = await fetch(
                    `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/course/${courseID}`,
                    {
                      method: "GET",
                      headers: {
                        Authorization: `${token}`,
                      },
                    }
                  );
            
                  if (!response.ok) {
                    throw new Error(`Error: ${response.status} - ${response.statusText}`);
                  }
            
                  const responseData = await response.json();
                  console.log("API initial Response:", responseData);
            
                  if (responseData.success && responseData.data) {
                    results.push(responseData.data);
                    console.log("The real data gan gan :", results) 
                  }
                }
            
                setCourses(results);
              } catch (error) {
                console.error("Error fetching course data:", error);
              } finally {
                setLoading((prev) => ({
                  ...prev,
                  view: { ...prev.view, [num]: false },
                }));
                setLoading((prev) => ({ ...prev, wait: false }));
              }
      };

   const handleDelete = async (id: number) => {
       setLoading((prev) => ({
         ...prev,
         delete: {
           ...prev.delete,
           [id]: true, 
         },
       }));
       try {
         await handledeleteProgram(id, token, (message: string) => {
           setDelMessage((prev) => ({
             ...prev,
             [id]: message,
           }));
         });
     
         if (token) {
           fetchRegistrationData(token,  setRegistration, setIsRegistrationOpen, setError);
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
             [id]: false, // Set loading to false for the specific course
           },
         }));
       }
     };
     

      const handleRegistrationOpenOrClose = async (id: number) => { 

        try {
          const isCurrentlyOpen = isRegistratinOpen[id];
          const enpoints = isCurrentlyOpen ? `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/registration/${id}/close_registration/` : `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/registration/${id}/open_registration/`

          const response = await fetch(enpoints, {
            method: "PUT",
            headers: {
              Authorization: `${token}`,
              "Content-Type": "application/json", 
            },
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
          } else {
            const data = await response.json();
            setIsRegistrationOpen((prevState) => ({
              ...prevState,
              [id]: data.data.is_open, 
            }));
          }
    
         
        } catch (error) {

        }


      }
      
const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => {
        const { name, value } = e.target;
      
        setFormData((prevData) => ({
          ...prevData, 
          [name]: value, 
        }));
      };

      const handleProgramSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        console.log(formData)
        setErrors(initialFormErrors);
        setLoading((prev) => ({ ...prev, add: true }));

        try {
            const response = await fetch(
                "https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/registration/",
                {
                  method: "POST",
                  headers: {
                    Authorization: `${token}`, 
                    "Content-Type": "application/json", 
                  },
                  body: JSON.stringify(formData), 
                }
              );
          
              const data = await response.json();
              if (response.ok) {
                setMessage("Course Created successfully");
                console.log("course created");
                setFormData(initialFormState);
                const timer = setTimeout(() => {
                  openandCloseProgram();
                  window.location.href="/Web3Lagos/Dashboard/Program"
                }, 3000);
              } else {
                setMessage(
                  `Unable to create Course: ${data.message || "Please try again later"}`
                );
              }
            
        } catch (error) {
            console.log("Network error:", error);
            setMessage("Network error. Please try again later");
          } finally {
            setLoading((prev) => ({ ...prev, add: false }));
          }
        };
      
      
      const openandCloseProgram = () => {
        setIsNewProgramOpen((prev) => !prev);
      }
      


      if (loading.other) {
        return (
          <div className="flex justify-center items-center h-screen">
            <div> <ScaleLoader /> </div>
          </div>
        );
      }
    
      if (error) {
        return (
          <div className="flex justify-center items-center h-screen">
            <div className="text-red-500">{error}</div>
          </div>
        );
      }

  return (
    <div className="w-full overflow-hidden h-[200vh] p-4 bg-green-200">
        <div className='flex justify-between mt-5'>
            <h1 className='text-3xl font-bold'>{isNewProgramOpen ? "Create New Program" : "All Program"}</h1>

        <div>
            <button className="flex justify-end items-center bg-[#2b292c] p-3 rounded-md text-white" onClick={openandCloseProgram}>Create Program</button>
        </div>
        </div>



        {isNewProgramOpen && (
             <div className="bg-white p-6 rounded-md shadow-md mt-5 space-x-4">
            <h2 className="text-2xl font-semibold">Add New Program</h2>
            <form onSubmit={handleProgramSubmit}  className="space-y-7 mt-6">
                <div className='space-y-3'>
                    <label className='font-bold'>Name</label>
                    <input type='text' placeholder='New program name' value={formData.name} name='name' onChange={handleChange} className="border w-full px-2 h-[5vh]" />
                </div>
                <div className='space-y-3'>
                    <label className='font-bold'>Cohort</label>
                    <input type='text' placeholder='XI' value={formData.cohort} name='cohort' onChange={handleChange} className="border w-full px-2 h-[5vh]" />
                </div>
                <div className='space-y-3'>
                    <label className='font-bold'>Registration Fee</label>
                    <input type='text' placeholder='New program name' value={formData.registrationFee} name='registrationFee' onChange={handleChange} className="border w-full px-2 h-[5vh]" />
                </div>
                <div className='space-y-3'>
                    <label className='font-bold'>Open Date</label>
                    <input type="date" name="start_date" id="" value={formData.start_date} onChange={handleChange} className="border w-full" />
                </div>
                <div className='space-y-3'>
                    <label className='font-bold'>Close Date</label>
                    <input type="date" name="end_date" id="" value={formData.end_date} onChange={handleChange} className="border w-full " />
                </div>
                <div className="flex justify-between">
                  <button type="submit"   className="mt-4 p-3 bg-blue-500 text-white rounded"  > {loading.add ? <BeatLoader size={10} color='#ffff' /> : "Add Program"} </button>
                  <button className="mt-2 text-red-500"  onClick={openandCloseProgram} >Cancel </button>
                </div>

                <div className="flex justify-center text-xl">
              {message ? <p>{message}</p> : "" }
              </div>
            </form>
            </div>
        )}
        
{!isNewProgramOpen && (
        <div>
        {registration.length === 0 ? (
          <p className="text-center">No programs found.</p>
        ) : (
            <div className='flex flex-wrap gap-5 justify-start mt-5'>

                {registration.map((register) => (
                    <div className='bg-white shadow-xl rounded-lg space-y-4 px-4 py-4 lg:w-[30%]'>
                        <p> <b>Name : </b>  {register.name}</p>
                         <p> <b>Cohort :</b> {register.cohort} </p>
                        <p> <b>Fee : </b> {register.registrationFee} </p>
                        <p> <b>Open Date : </b> {register.start_date} </p>
                        <p> <b>Close Date : </b> {register.end_date} </p>
                        <div className='flex justify-between'>
                        <button className='bg-green-700 px-2 text-white rounded-md py-1' onClick={() => handleCourse(register.courses, register.id)} >{loading.view[register.id] ? <BeatLoader size={5}  color='#ffff' />: "View Course" }</button>
                        <div className='flex gap-5'>
                          <button onClick={() => handleRegistrationOpenOrClose(register.id)}  title={  isRegistratinOpen[register.id]   ? "Close Registration"  : "Open Registration"  }>
                        {isRegistratinOpen[register.id] ? (
                                <span role="img" className='text-2xl' aria-label="Open Lock">
                                  🔓
                                </span>
                              ) : (
                                <span role="img" className='text-2xl' aria-label="Closed Lock">
                                  🔒
                                </span>
                              )}
                              </button>
                        <button className="bg-blue-700 px-2 text-white rounded-md py-1" onClick={() => { setSelectedProgram(register); setEditForm({ name: register.name, cohort: register.cohort ?? "", registrationFee: register.registrationFee, start_date: register.start_date, end_date: register.end_date }); setIsEditOpen(true); }}>Edit</button>
                        <button onClick={() => handleDelete(register.id)}>{loading.delete[register.id] ? <BeatLoader size={5} />: <Trash2 /> }</button>

                        </div>
                            </div>

                            {Delmessage[register.id] && (
                            <div>
                                <p className="text-center ">{Delmessage[register.id]}</p>
                            </div>
                            )}

                     </div>         
                ))}
            </div>
        )}
        </div>
        )

    }

       <AnimatePresence>
           {openCourses && (
                  <div
                  className="fixed inset-0 bg-black bg-opacity-50 z-10"
                  onClick={() => setOpenCourse(false)}
                  />
              )} 


       {openCourses && (
       <motion.div
       initial={{ opacity: 0, y: 100 }}
       animate={{ opacity: 1, y: 0 }}
       exit={{ opacity: 0, y: 100 }}
       transition={{ duration: 0.4, ease: "easeOut" }}
       className="fixed top-[10%]  transform -translate-x-1/2 w-full max-w-3xl h-[700px] bg-white p-6 rounded-lg shadow-lg z-20 overflow-y-auto"
     >
       <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Courses</h2>
                  <button
                  onClick={() => setOpenCourse(false)}
                    className="text-gray-600 hover:text-red-500"
                  >
                    ✕
                  </button>
                </div>
                <div className='flex flex-col gap-5 mt-3'>
          {loading.wait ? (
            <div className='flex justify-center items-center h-[70vh]'>
              <p className='flex items-end '>Crunching data  <BeatLoader size={5} /></p>
            </div>
          )  : courses.length === 0 ? (
            <div className='flex justify-center items-center gap-2 flex-col h-[70vh]'>
              <p>No course available</p>
              <a href='/Web3Lagos/Dashboard' className='text-base text-blue-800'>Create course</a>
            </div>
          )  : (
            courses.map((course) => (
              <div key={course.id} className='text-black p-3 border rounded-lg bg-gray-100'>
                <h2><b>Name: </b>{course.name}</h2>
                <p><b>Course: </b>{course.description}</p>
                <p><b>Venue: </b>{course.venue.join(" , ")}</p>
                <p><b>Status: </b>{course.status ? "Active" : "Inactive"}</p>
                <p><b>Extra Info: </b>{course.extra_info}</p>
              </div>
            ))
          )}
        </div>

    </motion.div>
       )}
       </AnimatePresence>

       {/* Edit Modal/Dialog */}
       <Dialog open={isEditOpen} onOpenChange={open => { setIsEditOpen(open); if (!open) setEditMessage(""); }}>
         <DialogContent className="max-w-lg w-full">
           <DialogHeader>
             <DialogTitle>Edit Program</DialogTitle>
           </DialogHeader>
           <form onSubmit={async (e) => {
             e.preventDefault();
             setEditErrors(initialFormErrors);
             setEditLoading(true);
             try {
               if (!selectedProgram) return;
               const response = await fetch(`https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/registration/${selectedProgram.id}/`, {
                 method: "PUT",
                 headers: { Authorization: `${token}`, "Content-Type": "application/json" },
                 body: JSON.stringify(editForm),
               });
               const data = await response.json();
               if (response.ok && data.success) {
                 setEditMessage("Program updated successfully.");
                 // update registration list in place
                 setRegistration((prev) => prev.map(r => r.id === selectedProgram.id ? { ...r, ...editForm } : r));
                 setTimeout(() => { setIsEditOpen(false); setEditMessage(""); }, 1500);
               } else {
                 setEditMessage(data.message || "Update failed");
               }
             } catch (error:any) {
               setEditMessage(error.message || "Update error");
             } finally {
               setEditLoading(false);
             }
           }} className="space-y-6 mt-2">
             <div>
               <label className='font-bold'>Name</label>
               <input type='text' name='name' value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="border w-full px-2 h-[5vh]" required />
             </div>
             <div>
               <label className='font-bold'>Cohort</label>
               <input type='text' name='cohort' value={editForm.cohort} onChange={e => setEditForm(f => ({ ...f, cohort: e.target.value }))} className="border w-full px-2 h-[5vh]" required />
             </div>
             <div>
               <label className='font-bold'>Registration Fee</label>
               <input type='text' name='registrationFee' value={editForm.registrationFee} onChange={e => setEditForm(f => ({ ...f, registrationFee: e.target.value }))} className="border w-full px-2 h-[5vh]" required />
             </div>
             <div>
               <label className='font-bold'>Open Date</label>
               <input type="date" name="start_date" value={editForm.start_date} onChange={e => setEditForm(f => ({ ...f, start_date: e.target.value }))} className="border w-full" required />
             </div>
             <div>
               <label className='font-bold'>Close Date</label>
               <input type="date" name="end_date" value={editForm.end_date} onChange={e => setEditForm(f => ({ ...f, end_date: e.target.value }))} className="border w-full" required />
             </div>
             <div className="flex gap-2 mt-2">
               <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50" disabled={editLoading}>{editLoading ? <BeatLoader size={8} color="#fff" /> : "Save"}</button>
               <button type="button" className="border px-4 py-2 rounded" onClick={() => setIsEditOpen(false)}>Cancel</button>
             </div>
             {!!editMessage && <div className="text-center text-sm mt-2 text-blue-800">{editMessage}</div>}
           </form>
         </DialogContent>
       </Dialog>
    </div>
  )
}

export default page