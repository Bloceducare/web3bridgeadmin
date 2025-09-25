"use client"

import React, {useEffect, useState} from 'react'
import { ScaleLoader, BeatLoader } from 'react-spinners'
import { Trash2 } from 'lucide-react'
import { handledeleteProgram, fetchOpenRegistrationData } from '@/hooks/useUpdateProgram';
import { motion, AnimatePresence } from "framer-motion"


interface Program {
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
}

function page() {
        const [registration, setRegistration] = useState<Program[]>([])
        const [isRegistratinOpen, setIsRegistrationOpen] = useState<{ [key: number]: boolean }>({});
        const [token, setToken] = useState("")
        const [courses, setCourses] = useState<Course[]>([]);
        const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
          const [openCourses, setOpenCourse] = useState<boolean>(false)
        
                        
          
          const [error, setError] = useState<string | null>(null);
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


    useEffect(() => {
          const token = localStorage.getItem("token") || "";
          setToken(token)
          fetchOpenRegistrationData(token,  setRegistration, setIsRegistrationOpen, setError, setLoading);
        }, []);
                


          const handleCourse = async (id: number[], num: number) => {
            console.log("Fetching courses for IDs:", id);
            setOpenCourse(true)
            setLoading((prev) => ({
              ...prev,
              view: { ...prev.view, [num]: true },
            }));
            setLoading((prev) => ({ ...prev, wait: true }));
          
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
                     fetchOpenRegistrationData(token,  setRegistration, setIsRegistrationOpen, setError);
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
        <div className='mt-5'>
        <h1 className='text-3xl font-bold'>Opened Programs</h1>
        {registration.length === 0 ? (
          <p className="text-center mt-5">No programs opened at the moment.</p>
        ) : ( 
            <div className='flex flex-wrap gap-5 justify-start mt-5'>

            {registration.map((register) => (
                <div className='bg-white shadow-xl rounded-lg space-y-4 px-4 py-4 w-[32%]'>
                    <p> <b>Name : </b>  {register.name}</p>
                    <p> <b>Fee : </b> {register.registrationFee} </p>
                    <p> <b>Open Date : </b> {register.start_date} </p>
                    <p> <b>Close Date : </b> {register.end_date} </p>
                    <div className='flex justify-between'>
                    <button className='bg-green-700 px-2 text-white rounded-md py-1' onClick={() => handleCourse(register.courses, register.id)} >  {loading.view[register.id] ? <BeatLoader size={5} color='#fff' />  : "View Course"}</button>
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
        </div>



    </div>
  )
}

export default page