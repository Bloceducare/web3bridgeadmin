export const fetchRegistrationData = async (
    token: string,
    setRegistration: (data: any) => void,
    setIsRegistrationOpen: (state: { [key: number]: boolean }) => void,
    setError: (message: string) => void,
    setLoading?: (value: (prev: any) => any) => void 
  ) => {

    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: true }));
      }
  
    try {
        if (setLoading) {
            setLoading((prev: any) => ({ ...prev, other: true }));
          }
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
        if (setLoading) {
            setLoading((prev: any) => ({ ...prev, other: false }));
          }
    }
};

export const fetchOpenRegistrationData = async (
token: string,
setRegistration: (data: any) => void,
setIsRegistrationOpen: (state: { [key: number]: boolean }) => void,
setError: (message: string) => void,
setLoading?: (value: (prev: any) => any) => void 
) => {

if (setLoading) {
    setLoading((prev: any) => ({ ...prev, other: true }));
}

try {
    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: true }));
    }
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
    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: false }));
    }
}
};
  
export const handledeleteProgram = async (
    id: number,
    token: string,
    setDelMessage: (data: string) => void
  ) => {
  
    try {
      const response = await fetch(
        `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/registration/${id}/`,
        {
          method: "DELETE",
          headers: {
            Authorization: `${token}`,
          },
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        console.log("Course deleted:", data);
        setDelMessage("Program deleted successfully");
      } else {
        throw new Error("Failed to delete Program");
      }
    } catch (error) {
      console.error("Error deleting course:", error);
    } finally {
    }
  };
  