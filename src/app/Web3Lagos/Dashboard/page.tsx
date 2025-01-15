"use client";
import axios from "axios";
import { useEffect, useState } from "react";
import { ScaleLoader } from "react-spinners";


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
  name: string;
  description: string;
  venue: ("online" | "onsite")[]; 
  extra_info: string;
  images: File[]; 
  registration: number[];
  [key: string]: any;
};


type FormErrors = {
  [key in keyof FormData]?: string[];
};

const initialFormState: FormData = {
  name: "",
  description: "",
  venue: [], 
  extra_info: "",
  images: [], 
  registration: []
};

const initialFormErrors: FormErrors = {};



export default function Dashboard() {
  const [formData, setFormData] = useState<FormData>(initialFormState)
      const [errors, setErrors] = useState<FormErrors>(initialFormErrors);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<{
    delete: { [key: number]: boolean }; 
    other: boolean; 
    add: boolean;
  }>({
    delete: {}, 
    other: false,
    add: false
  });
  
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState<number | null>(null); 
  const [isNewCourseOpen, setIsNewCourseOpen] = useState<boolean>(false); 
  const [Delmessage, setDelMessage] = useState<Record<string, string>>({});
  const [token, setToken] = useState("")
  const [registration, setRegistration] = useState<Registration[]>([])
  const [selectedPrograms, setSelectedPrograms] = useState<number[]>([]);

  
  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    setToken(token)
    const fetchPrograms = async () => {
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
          `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/all/`,
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
        setLoading((prev) => ({ ...prev, other: false }));
      }
    };

    fetchPrograms();
  }, []);

  useEffect(() => {

    const fetchRegistration = async () => {
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

  const toggleDescription = (programId: number) => {
    setExpandedDescriptionId((prev) => (prev === programId ? null : programId)); 
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
  
  
  const openandCloseCourse = () => {
    setIsNewCourseOpen((prev) => !prev);
  }
  

  const handleNewCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("clicked");
    setMessage("");
    setErrors(initialFormErrors);
    setLoading((prev) => ({ ...prev, add: true }));
  
    const formDataToSend = new FormData();
  
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("extra_info", formData.extra_info);
  
    formDataToSend.append("venue", JSON.stringify(formData.venue));
    formData.registration.forEach((registerId) => {
      formDataToSend.append("registration", registerId.toString()); 
    });
  
    formData.images.forEach((file) => {
      formDataToSend.append("images", file);
    });

    console.log("FormData being sent:", [formDataToSend]);
  
    try {
      const response = await fetch(
        "https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/",
        {
          method: "POST",
          headers: {
            Authorization: `${token}`, 
          },
          body: formDataToSend, 
        }
      );
  
      const data = await response.json();
  
      if (response.ok) {
        setMessage("Course Created successfully");
        console.log("course created");
        setFormData(initialFormState);
        const timer = setTimeout(() => {
          openandCloseCourse();
          window.location.href="/Web3Lagos/Dashboard"
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
  
  
  const handleDelete = async (id: number) => {
    try {
      setLoading((prev) => ({
        ...prev,
        delete: { ...prev.delete, [id]: true },
      }));
    
      const response = await fetch(
        `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/${id}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json", 
            Authorization: `${token}`, 
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        console.log("Course deleted:", data);
  
        setDelMessage((prev) => ({
          ...prev,
          [id]: "Course deleted successfully!",
        }));
  
        const timer = setTimeout(() => {
          window.location.href = "/Web3Lagos/Dashboard";
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete course");
      }
    } catch (error) {
      console.error("Error deleting the course:", error);
      setMessage("Error deleting the Course");
    } finally {
      setLoading((prev) => ({
        ...prev,
        delete: { ...prev.delete, [id]: false },
      }));
      }
  };
  

  const handleUpdate = ( id: number ) => {

    console.log( "This is the Updated clicked id", id)

  }

  

  return (
    <div className="bg-green-200 w-full h-full p-10">


      <div className="space-y-10">
        <div className="flex justify-between">
        <h1 className="text-center text-3xl font-bold"> {isNewCourseOpen ? "Create New Course" : "All Courses"}</h1>
        <button className="flex justify-end items-center bg-[#2b292c] p-3 rounded-md text-white" onClick={openandCloseCourse}>New Course </button>
        </div>

          {/* New Course Form */}
          {isNewCourseOpen && (
          <div className="bg-white p-6 rounded-md shadow-md mt-2 space-x-4">
            <h2 className="text-2xl font-semibold">Add New Course</h2>
            <form onSubmit={handleNewCourse} className="space-y-6 mt-3">
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
          <button type="submit"   className="mt-4 p-3 bg-blue-500 text-white rounded"  > {loading.add ? "Adding....." : "Add Course"} </button>
          <button className="mt-2 text-red-500"  onClick={openandCloseCourse} >Cancel </button>
          </div>

          <div className="flex justify-center text-xl">
              {message ? <p>{message}</p> : "" }
              </div>

            </form>
          </div>
        )}

        {/*End of new course form */}



{!isNewCourseOpen && (

  <div>
        {programs.length === 0 ? (
          <p className="text-center">No programs found.</p>
        ) : (
          <div className="flex flex-wrap  gap-10">
            {programs.map((program) => (
              <div
                key={program.id}
                className="bg-white p-4 rounded-md shadow-md  w-[45%] cursor-pointer space-y-3"
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
                      src={`https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/all${image.picture}`}
                      alt={`Image for ${program.name}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ))}
                </div>

                <div className="flex justify-end gap-5 items-end">
                <button className="bg-green-700 px-3 py-1 rounded-md text-white" onClick={ () => handleUpdate(program.id)}>Update</button>
                  <button className="bg-red-800 px-3 py-1 rounded-md text-white" onClick={ () => handleDelete(program.id)}>{loading.delete[program.id] ? "Deleting...." : "Delete"}</button>
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
        </div>
    )}

      </div>
    </div>
    
  );
}

