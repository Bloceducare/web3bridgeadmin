"use client"

import React, { useEffect, useState } from 'react'
import { ScaleLoader } from "react-spinners";
import { Trash2, LockKeyholeOpen,  } from 'lucide-react';
import {BeatLoader} from 'react-spinners';


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
}

type FormData = {
    name: string;
    start_date: string;
    end_date: string;
    registrationFee: string
}

const initialFormState: FormData = {
    name: "",
    start_date: "",
    end_date: "",
    registrationFee: ""
};

type FormErrors = {
    [key in keyof FormData]?: string[];
  };

const initialFormErrors: FormErrors = {};

function page() {
      const [registration, setRegistration] = useState<Registration[]>([])
        const [formData, setFormData] = useState<FormData>(initialFormState)
            const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
      const [error, setError] = useState<string | null>(null);
      const [token, setToken] = useState("")
      const [message, setMessage] = useState("");
      const [isNewProgramOpen, setIsNewProgramOpen] = useState<boolean>(false); 
        const [courses, setCourses] = useState<Course[]>([]);
        const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
      const [loading, setLoading] = useState<{
        delete: { [key: number]: boolean }; 
        other: boolean; 
        add: boolean;
      }>({
        delete: {}, 
        other: false,
        add: false
      });

    

    useEffect(() => {
        const token = localStorage.getItem("token") || "";
        setToken(token)

        const fetchRegistration = async () => {
            setLoading((prev) => ({ ...prev, other: true }));
      
            if (!token) {
              setLoading((prev) => ({ ...prev, other: false }));
              setError("You are not logged in");
              const timer = setTimeout(() => {
               window.location.href = "/"
              }, 1000)
      
              return;
            }
          try {
    
            const response = await fetch(
              `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/all/`,
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
    
        fetchRegistration();
      }, []);

      const handleCourse = async (id: number[]) => {
        console.log("Fetching courses for IDs:", id);
      
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
        }
      };

      const handleDelete = async (id: number) => {
        setLoading((prev) => ({
            ...prev,
            delete: { ...prev.delete, [id]: true },
          }));
        try {
            const response = await fetch(`https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/${id}/`, {
                method: "DELETE",
                headers: {
                  Authorization: `${token}`,
                },  
            })
            if (response.ok) {
                const data = await response.json();
                console.log("Course deleted:", data);
          
                setDelMessage((prev) => ({
                  ...prev,
                  [id]: "Course deleted successfully!",
                }));
            }

            const timer = setTimeout(() => {
                window.location.href="/Web3Lagos/Dashboard/Program"
              }, 3000);

        } catch (error) {
            console.error(error)
        } finally {
            setLoading((prev) => ({
                ...prev,
                delete: { ...prev.delete, [id]: false },
              }));
              
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
                "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/",
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
    <div className="w-full overflow-hidden h-full p-4 bg-green-200">
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
                    <div className='bg-white shadow-xl rounded-lg space-y-4 px-4 py-4 w-[35%]'>
                        <p> <b>Name : </b>  {register.name}</p>
                        <p> <b>Fee : </b> {register.registrationFee} </p>
                        <p> <b>Open Date : </b> {register.start_date} </p>
                        <p> <b>Close Date : </b> {register.end_date} </p>
                        <div className='flex justify-between'>
                        <button className='bg-green-700 px-2 text-white rounded-md py-1' onClick={() => handleCourse(register.courses)} >View Course</button>
                        <button onClick={() => handleDelete(register.id)}>{loading.delete[register.id] ? <BeatLoader size={5} />: <Trash2 /> }</button>
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
  )
}

export default page