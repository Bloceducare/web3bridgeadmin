"use client";
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

interface ApiResponse {
  success: boolean;
  data: Program[];
}

export default function OpenCourse() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDescriptionId, setExpandedDescriptionId] = useState<number | null>(null); // Track which program's description is expanded

  // Ideally, store the token securely (in localStorage or context)
  const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzM5MDE0NzQ2LCJpYXQiOjE3MzY0MjI3NDYsImp0aSI6ImZhMGY1ZjRkZjU4ODQ5ODg4MTBmZjFmNDNiOGM0YWQ3IiwidXNlcl9pZCI6MX0.7LpqI4jMEV9Ef-QjDDMIYF4d02NsaxbN52SZHOxL-qU";

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!token) {
        setError("No authorization token found.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/course/all_opened/`,
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
  }, [token]);

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

  return (
    <div className="bg-green-200 w-full h-full p-10">
      <div className="space-y-10">
        <h1 className="text-center text-3xl font-bold">Program opened</h1>
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
                      src={`https://web3bridgewebsitebackend.onrender.com/api/${image.picture}`}
                      alt={`Image for ${program.name}`}
                      className="w-24 h-24 object-cover rounded"
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
