"use client"

import React, {useEffect, useState} from 'react'
import { ScaleLoader, BeatLoader } from 'react-spinners'

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
                        
          
          const [error, setError] = useState<string | null>(null);
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


          useEffect(() => {
            const token = localStorage.getItem("token") || "";
            setToken(token)

            setLoading((prev) => ({ ...prev, other: true }));

        
            const fetchPrograms = async () => {
              if (!token) {
                setError("You are not logged in.");
                return;
              }
        
              try {
                const response = await fetch(
                  `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/all_opened/`,
                  {
                    method: "GET",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                  }
                );
        
                const data = await response.json(); 
        
                if (response.ok) {
                  setRegistration(data.data); 
                  const initialState = data.data.reduce(
                    (acc: { [key: number]: boolean }, register: { id: number; is_open: boolean }) => {
                      acc[register.id] = register.is_open;
                      return acc;
                    },
                    {}
                  );
        
                  setIsRegistrationOpen(initialState);
                } else {
                  setError(`Failed to fetch programs: ${data.message || "Unknown error"}`);
                }
              } catch (error) {
                setError("Error fetching data");
                console.error("Error fetching data:", error);
              } finally {
                setLoading((prev) => ({ ...prev, other: false }));

              }
            };
        
            fetchPrograms();
          }, []);

          const handleCourse = async (id: number[], num: number) => {
            console.log("Fetching courses for IDs:", id);
            setLoading((prev) => ({
              ...prev,
              view: { ...prev.view, [num]: true },
            }));
          
            try {
              const results: Course[] = []; 
          
              for (const courseID of id) {
                const response = await fetch(
                  `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/${courseID}`,
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
            }
          };

          const handleRegistrationOpenOrClose = async (id: number) => { 

            try {
              const isCurrentlyOpen = isRegistratinOpen[id];
              const enpoints = isCurrentlyOpen ? `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/${id}/close_registration/` : `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/${id}/open_registration/`
    
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
    <div className="w-full overflow-hidden h-full p-4 bg-green-200">
        <div className='mt-5'>
        <h1 className='text-3xl font-bold'>Opened Programs</h1>
        {registration.length === 0 ? (
          <p className="text-center mt-5">No programs opened at the moment.</p>
        ) : ( 
            <div className='flex flex-wrap gap-5 justify-start mt-5'>

            {registration.map((register) => (
                <div className='bg-white shadow-xl rounded-lg space-y-4 px-4 py-4 w-[35%]'>
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

                    </div>
                        </div>
                 </div>         
            ))}
        </div>

        
        )}
<div className='flex flex-col gap-5 mt-3'>
      {courses.map((course) => (
        <div key={course.id} className='border-2 border-black  rounded-md p-2  '>
          <h2> <b>Name : </b> {course.name}</h2>
          <p> <b>Course : </b> {course.description}</p>
          <p> <b>  Venue: </b>{course.venue.join(" , ")}</p>
          <p> <b>Status:</b>  {course.status ? "Active" : "Inactive"}</p>
          <p> <b>Extra Info:</b>  {course.extra_info}</p>
        </div>
      ))}
    </div>

        </div>



    </div>
  )
}

export default page