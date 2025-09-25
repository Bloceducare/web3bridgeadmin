"use client";
import React, { useEffect, useState } from "react";
import { ScaleLoader, BeatLoader } from "react-spinners";
import { Pencil, Trash2 } from "lucide-react";
import { handleUpdateCourse, handleUpdateCourseButton, handleDeleteCourse, fetchPrograms } from "@/hooks/useUpdateCourse";


interface Image {
  id: number;
  picture: string;
}

interface Program {
  id: number;
  name: string;
  description: string;
  venue: string[];
  extra_info: string;
  images: Image[];
  status: boolean;
}

interface Registration {
  id: number,
  name: string;
  is_open: string;
  end_date: string;
  registrationFee: string;
  courses: number[];
  cohort: null | string;
}

interface ApiResponse {
  success: boolean;
  data: Program[];
}

type FormData = {
  id: number | null;
  name: string;
  description: string;
  venue: ("online" | "onsite")[]; 
  extra_info: string;
  images: File[]; 
  registration: number[];
  [key: string]: any;
};

interface currentProgram {
  id: number;
  name: string;
  description: string;
  venue: string[];
  extra_info: string;
  images: Image[];
  status: boolean;
}

const initialFormState: FormData = {
  id: null,
  name: "",
  description: "",
  venue: [], 
  extra_info: "",
  images: [], 
  registration: []
};

type FormErrors = {
  [key in keyof FormData]?: string[];
};

const initialFormErrors: FormErrors = {};


export default function OpenCourse() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isCourseOpen, setIsCourseOpen] = useState< {[key: number]: boolean}>({})
  const [message, setMessage] = useState("");
  const [clickedProgram, setClickedPrograms] = useState<currentProgram[]>([])
   const [formData, setFormData] = useState<FormData>(initialFormState)
   const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
   const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdateOpen, setIsUpdateOpen] = useState<boolean>(false); 
  const [expandedDescriptionId, setExpandedDescriptionId] = useState<number | null>(null);
  const [token, setToken] = useState("")
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);
    const [registration, setRegistration] = useState<Registration[]>([])
    const [loadings, setLoadings] = useState<{
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

    const fetchPrograms = async () => {
      if (!token) {
        setError("No authorization token found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/course/all_opened/`,
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
          setPrograms(data.data); 
        } else {
          setError(`Failed to fetch programs: ${data.message || "Unknown error"}`);
        }
      } catch (error) {
        setError("Error fetching data");
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {

    const fetchRegistration = async () => {
      try {

        const response = await fetch(
          `https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/cohort/registration/all/`,
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
        setLoadings((prev) => ({ ...prev, other: false }));
      }
    };

    fetchRegistration();
  }, []);

  const toggleDescription = (programId: number) => {
    setExpandedDescriptionId((prev) => (prev === programId ? null : programId)); 
  };

  if (loading) {
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

  const handleChangePic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = e.target;
  
    if (files && files.length > 0) {
      const fileArray = Array.from(files); 
  
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...fileArray], 
      }));
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
  
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      const checked = e.target.checked;
  
      setFormData((prevData) => {
        const currentValues = Array.isArray(prevData[name])
          ? prevData[name]
          : [];
        if (checked) {
          return {
            ...prevData,
            [name]: [...currentValues, value],
          };
        } else {
          return {
            ...prevData,
            [name]: currentValues.filter((item) => item !== value),
          };
        }
      });
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: undefined,
    }));
  };

    
  const openandCloseUpdate = () => {
    setIsUpdateOpen((prev) => !prev);
  }

  const handleSelectProgram = (id: number) => {
    console.log(id)
    setSelectedPrograms((prevSelected) => {
      if (prevSelected.includes(id)) {
        // If the program is selected remove the program shii
        return prevSelected.filter((programId) => programId !== id);
      } else {
        // If the program is not selected, add the program
        return [...prevSelected, id];
      }
    });
    setFormData((prev) => {
      const isAlreadySelected = prev.registration.includes(id);

      return {
        ...prev,
        registration: isAlreadySelected
          ? prev.registration.filter((regId) => regId !== id) 
          : [...prev.registration, id], 
      };
    });
  };
  


  const handleDelete = async (id: number) => {
    setLoadings((prev) => ({
      ...prev,
      delete: {
        ...prev.delete,
        [id]: true, 
      },
    }));
    try {
      await handleDeleteCourse(id, token, (message: string) => {
        setDelMessage((prev) => ({
          ...prev,
          [id]: message,
        }));
      });
  
      if (token) {
        fetchPrograms(token,  setPrograms, setIsCourseOpen, setError);
      }
    } catch (error) {
      console.error("Error deleting the course:", error);
      setDelMessage((prev) => ({
        ...prev,
        [id]: "An error occurred while deleting the course.",
      }));
    } finally {
      setLoadings((prev) => ({
        ...prev,
        delete: {
          ...prev.delete,
          [id]: false, // Set loading to false for the specific course
        },
      }));
    }
  };

  const handleUpdateButton = (id: number) => { 
    handleUpdateCourseButton(id, token, formData, setFormData, setClickedPrograms, openandCloseUpdate)
  }
    const refresh = "/Web3Lagos/Dashboard/OpenCourse"
  
    const updateCourse = (id: number) => {
      handleUpdateCourse(id, token, refresh, formData, setMessage, setFormData, setClickedPrograms, openandCloseUpdate)
    } 

    const handleUpdateSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLoadings((prev) => ({ ...prev, add: true }));
      try {
        if (formData.id !== null) {
          updateCourse(formData.id);
        }
      } catch (error) {
        setLoadings((prev) => ({ ...prev, add: false }));
      }    
    };

  return (
    <div className="bg-green-200 w-full  h-[200vh] p-10">
      <div className="space-y-10">
        <h1 className="text-center text-3xl font-bold">{isUpdateOpen? "Update Courses" : "Courses opened"}</h1>


            {/* New Course Form */}
            {isUpdateOpen && (
          <div className="bg-white p-6 rounded-md shadow-md mt-2 space-x-4">
            <h2 className="text-2xl font-semibold">Add New Course</h2>
            <form className="space-y-6 mt-3" onSubmit={handleUpdateSubmit}>
              <div className="space-y-2">
                <label className="font-semibold">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="border rounded p-2 w-full"
                />
              </div>
              <div className="space-y-2">
                <label className="font-semibold">Description</label>
              <p className="border w-full h-[18vh]">  <input type="text" name="description" id="" value={formData.description} onChange={handleChange} className="w-full h-[10vh] outline-none"  /></p>
              </div>

              <div className="space-y-3">
                <label className="font-semibold">Extra info</label>
                <input type="text" name="extra_info" id="" value={formData.extra_info} onChange={handleChange} className="border w-full h-[7vh]" />
              </div>

              <div className="space-y-3">
              
                 <label className="font-semibold">Select Image</label>
              <input
                type="file" name="images" multiple   id="" onChange={handleChangePic}  className=""/>
                 </div>


        <div className="space-y-5">
          <div className="space-x-2">
          <input
              type="checkbox"
              name="venue"
              value="online"
              id="online"
              onChange={handleChange}
            />
            <label htmlFor="online">Online</label>
          </div>

          <div className="space-x-2">
          <input
              type="checkbox"
              name="venue"
              value="onsite"
              id="onsite"
              onChange={handleChange}
            />
            <label htmlFor="onsite">Onsite</label>
          </div>
          </div>

          <div>
            <p className="font-semibold">Select program</p>
            <div className="flex flex-row gap-4 flex-wrap">
            {registration.map((register) => (
              <div >
                <p onClick={() => handleSelectProgram(register.id)} className={`mt-2 rounded-md px-4 py-2 text-white cursor-pointer ${
              selectedPrograms.includes(register.id) ? "bg-blue-500" : "bg-green-500"
            }`}>{register.name}</p>
              </div>
            ))

            }
            </div>
            
          </div>

          <div className="flex justify-between">
          <button type="submit"   className="mt-4 p-3 bg-blue-500 text-white rounded"  > {loadings.add ? <BeatLoader size={10} color='#ffff' /> : "Add Course"} </button>
          <button className="mt-2 text-red-500"  onClick={openandCloseUpdate} >Cancel </button>
          </div>

          <div className="flex justify-center text-xl">
              {message ? <p>{message}</p> : "" }
              </div>

            </form>
          </div>
        )}

        {/*End of new course form */}






{!isUpdateOpen && (
      <section>

      {programs.length === 0 ? (
                <p className="text-center">No programs opened at the moment.</p>
              ) : (
                <div className="flex flex-wrap  gap-10">
                  {programs.map((program) => (
                    <div
                      key={program.id}
                      className="bg-white p-4 rounded-md shadow-md  w-[45%] cursor-pointer"
                      onClick={() => toggleDescription(program.id)} 
                    >
                      <h2 className="text-xl font-semibold">{program.name}</h2>

                      <div
                        className={`
                          transition-all ease-out duration-300 overflow-hidden
                          ${expandedDescriptionId === program.id ? "max-h-screen" : "max-h-24"} 
                          ${expandedDescriptionId === program.id ? "py-4" : "py-2"}
                        `}
                      >
                        <p className="text-base  leading-7">
                          {expandedDescriptionId === program.id
                            ? program.description
                            : `${program.description.slice(0, 100)}...`}
                        </p>

                        {program.description.length > 100 && (
                        <button
                          className="text-blue-500 text-sm mt-2"
                          onClick={(e) => {
                            e.stopPropagation(); 
                            toggleDescription(program.id);
                          }}
                        >
                          {expandedDescriptionId === program.id ? "Show less" : "Read more"}
                        </button>
                      )}
                      </div>

                  

                      <p>
                        <strong>Venue:</strong> {program.venue.join(", ")}
                      </p>
                      <p>
                        <strong>Status:</strong> {program.status ? "Active" : "Inactive"}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {program.images.map((image) => (
                          <img
                            key={image.id}
                            src={`https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/${image.picture}`}
                            alt={`Image for ${program.name}`}
                            className="w-24 h-24 object-cover rounded"
                          />
                        ))}
                      </div>

                      <div className="flex justify-end gap-5 items-end">
                  <button title="Update Course" onClick={ () => handleUpdateButton(program.id)}> <Pencil /> </button>
                  <button title="Delete course" className="bg-red-800 px-3 py-1 rounded-md text-white" onClick={ () => handleDelete(program.id)}>{loadings.delete[program.id] ? <BeatLoader size={5} /> : <Trash2 />}</button>
                </div>

                {Delmessage[program.id] && (
          <div>
            <p className="text-center ">{Delmessage[program.id]}</p>
          </div>
        )}
                    </div>
                  ))}
                </div>
              )}


      </section>)}


    
      </div>
    </div>
  );
}
