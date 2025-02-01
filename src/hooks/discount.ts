import { error } from "console";

export const fetchAllDiscount = async (
    token: string, 
    setDiscountCodes: (data: any) => void, 
    setError: (message: string | null) => void,
    setLoading?: (value: (prev: any) => any) => void 
) => { 

    if (setLoading) {
        setLoading((prev: any) => ({ ...prev, other: true }));
      }

    try {
        const response = await fetch(
            `https://web3bridgewebsitebackend.onrender.com/api/v2/payment/discount/all/`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
                Authorization: `${token}`,
              },
            }
          );

          const data = await response.json();

          if(response.ok) { 
            setDiscountCodes(data.data);
          }

          console.log(response.json())
    } catch (error) {
        console.log(error)   
    } finally {
        if (setLoading) {
            setLoading((prev: any) => ({ ...prev, other: false }));
          }
    }
};

export const deleteCode = async ( id: number, token: string,
    setDelMessage: (data: string) => void) => {

        try {
            const response = await fetch(
              `https://web3bridgewebsitebackend.onrender.com/api/v2/payment/discount/${id}/`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `${token}`, 
                },
              }
            );

            if (response.status === 204) {
                // Successful delete with no content
                console.log("Code deleted successfully.");
                setDelMessage("Code deleted successfully.");
                return;
              }

              
            const data = await response.json();
        
            if (response.ok) {
              console.log("Course deleted:", data);
              setDelMessage("Code deleted successfully");
            } else {
              const data = await response.json();
              throw new Error(data.message || "Failed to delete course");
            }

            if (data.message.includes("does not exist")) {
                setDelMessage("This discount code does not exist.");
              } else {
                setDelMessage(data.message || "Failed to delete the code");
              }
            
          } catch (error) {
            console.error("Error deleting the course:", error);
            setDelMessage("Error deleting the Course");
          } 

}


export const generateDiscountCode = async (
  quantity: number, 
  token: string, 
  setNewDiscountCodes: (data: any) => void, 
  setMessage: (data: string) => void,
  setLoading?: (value: (prev: any) => any) => void 
) => {

  if (setLoading) {
    setLoading((prev: any) => ({ ...prev, new: true }));
  }

  try {
    const response = await fetch(`https://web3bridgewebsitebackend.onrender.com/api/v2/payment/discount/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`, 
      },
      body: JSON.stringify({ quantity }),
    });

    const data = await response.json();

    if (response.ok) {
      setNewDiscountCodes(data.data);
    } else {
      throw new Error(data.message || "Failed to generate discount code");
    }

  } catch (error: any) {
    console.error("Error generating discount code:", error);
    setMessage(error.message || "Something went wrong");
  } finally {
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, new: false }));
    }
  }
};


export const validateDiscountCode = async (
  discode: string,
  token: string,
  setMessage: (data: string) => void,
  setLoading?: (value: (prev: any) => any) => void
) => {
  if (setLoading) {
    setLoading((prev: any) => ({ ...prev, validate: true }));
  }

  const dataToSend = {
    code : discode
  }

  try {
    const dataToSendAsDict = Object.fromEntries(Object.entries(dataToSend)); 
    const response = await fetch(`https://web3bridgewebsitebackend.onrender.com/api/v2/payment/discount/validate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `${token}`, 
      },
      body: JSON.stringify({
        code: discode
      }),
    });

    const data = await response.json();

    if (response.ok) { 
      if (data === true) {
        setMessage("✅ Code is valid!");
      } else {
        setMessage("❌ Invalid discount code. Please try again.");
      }
    } else {
      throw new Error(data.message || "Failed to validate discount code");
    }

  } catch (error: any) {
    console.error("Error validating discount code:", error);
    setMessage(error.message || "Something went wrong");
  } finally {
    if (setLoading) {
      setLoading((prev: any) => ({ ...prev, validate: false }));
    }
  }
};

