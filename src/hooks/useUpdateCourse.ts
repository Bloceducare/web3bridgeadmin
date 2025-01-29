const url ="https://web3bridgewebsitebackend.onrender.com/api/v2"
const endpoint = "cohort/course"
const allProgramEndpoint = "cohort/course/all"

export const fetchPrograms = async (
  token: string,
  setPrograms: (data: any) => void,
  setIsCourseOpen: (data: { [key: number]: boolean }) => void,
  setError: (message: string | null) => void,
  setLoading?: (value: (prev: any) => any) => void 
) => {
  // Call setLoading if it's passed, otherwise skip
  if (setLoading) {
    setLoading((prev: any) => ({ ...prev, other: true }));
  }

  if (!token) {
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, other: false }));
    }
    setError("You are not logged in");
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
    return;
  }

  try {
    const response = await fetch(
      `${url}/${allProgramEndpoint}/`,
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
      const initialState = data.data.reduce(
        (acc: { [key: number]: boolean }, course: { id: number; status: boolean }) => {
          acc[course.id] = course.status;
          return acc;
        },
        {}
      );
      setIsCourseOpen(initialState);
    } else {
      setError(`Failed to fetch programs: ${data.message || "Unknown error"}`);
    }
  } catch (error) {
    setError("Error fetching data");
    console.error("Error fetching data:", error);
  } finally {
    // Call setLoading if it's passed, otherwise skip
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, other: false }));
    }
  }
};



export const handleUpdateCourseButton = async(
  id: number,
  token: string,
  formData: {
    name: string;
    description: string;
    extra_info: string;
    venue: ("online" | "onsite")[];
    images: File[];
    registration: number[];
  },
  setFormData: (data: any) => void,
  setClickedPrograms: (data: any) => void,
  openandCloseUpdate: () => void
) => {
  console.log("This is the clicked id", id)

  openandCloseUpdate(); 

  try {
    const getCurrentClickedData = await fetch (`${url}/${endpoint}/${id}/`,  
    {
      method: "GET",
      headers: {
        Authorization: `${token}`,
      }
    })

    const data = await getCurrentClickedData.json()

    if(getCurrentClickedData.ok) {
      setClickedPrograms(data.data)
      const program = data.data 

      setFormData({
        id: program.id,
        name: program.name || "",
        description: program.description || "",
        venue: (program.venue || []) as ("online" | "onsite")[], // Validate venue type
        extra_info: program.extra_info || "",
        images: [], // Convert program.images (URLs) to File[] if necessary
        registration: [],
      });
     
    }


  } catch (error) {
    console.log(error)
  }


}



export const handleUpdateCourse = async (
  id: number,
  token: string,
  refershLocation: string,
  formData: {
    name: string;
    description: string;
    extra_info: string;
    venue: ("online" | "onsite")[];
    images: File[];
    registration: number[];
  },
  setMessage : (data: string) => void,
  setFormData: (data: any) => void,
  setClickedPrograms: (data: any) => void,
  openandCloseUpdate: () => void
) => {
  console.log("This is the Updated clicked id", id);

  const formDataToSend = new FormData();
  formDataToSend.append("name", formData.name);
  formDataToSend.append("description", formData.description);
  formDataToSend.append("extra_info", formData.extra_info);
  formDataToSend.append("status", "true");
  formDataToSend.append("venue", JSON.stringify(formData.venue));
  formData.registration.forEach((registerId) => {
    formDataToSend.append("registration", registerId.toString());
  });
  formData.images.forEach((file) => {
    formDataToSend.append("images", file);
  });

  console.log("FormData being sent:", formDataToSend);

  try {
    const response = await fetch(`${url}/${endpoint}/${id}/`, {
      method: "PUT",
      headers: {
        Authorization: `${token}`,
      },
      body: formDataToSend, 
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Course Updated successfully");
      setClickedPrograms(data.data);
      const program = data.data;

      setFormData({
        id: program.id,
        name: program.name || "",
        description: program.description || "",
        venue: (program.venue || []) as ("online" | "onsite")[],
        extra_info: program.extra_info || "",
        images: [],
        registration: [],
      });
      const timer = setTimeout(() => {
         openandCloseUpdate();
         window.location.href=`${refershLocation}`;
      }, 3000);
    } else {
      console.error("Error updating course:", data.message);
      setMessage(`${data.message}`);
    }
  } catch (error) {
    console.error("Network error:", error);
    setMessage("Network error. Please try again later.");
  }
};


export const handleDeleteCourse = async ( 
  id: number,
  token: string,
  setDelMessage: (data: string) => void
) => {
  try {
    const response = await fetch(
      `${url}/${endpoint}/${id}/`,
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
      setDelMessage("Course deleted successfully");
    } else {
      const data = await response.json();
      throw new Error(data.message || "Failed to delete course");
    }
  } catch (error) {
    console.error("Error deleting the course:", error);
    setDelMessage("Error deleting the Course");
  } 
};