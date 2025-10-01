export const flattenParticipantData = (participants: any[]) => {
  return participants.map((participant) => ({
    id: participant.id || "",
    name: participant.name || "",
    email: participant.email || "",
    wallet_address: participant.wallet_address || "",
    status: participant.status || "",
    motivation: participant.motivation || "",
    achievement: participant.achievement || "",
    city: participant.city || "",
    state: participant.state || "",
    country: participant.country || "",
    gender: participant.gender || "",
    github: participant.github || "",
    number: participant.number || "",
    cohort: participant.cohort || "",
    payment_status: participant.payment_status ? "Paid" : "Unpaid",
    created_at: participant.created_at || "",
    updated_at: participant.updated_at || "",
    location: participant.venue || "",

    // Course details (nested)
    course_name: participant.course?.name || "",
    course_description: participant.course?.description || "",
    course_duration: participant.course?.duration || "",

    // Registration details (nested)
    registration_name: participant.registration?.name || "",
    registration_start: participant.registration?.start_date || "",
    registration_end: participant.registration?.end_date || "",
    registration_fee: participant.registration?.registrationFee || "",
  }));
};


const convertToCSV = (objArray: any[]) => {
  const array = [Object.keys(objArray[0]), ...objArray.map((item) => Object.values(item))];
  return array.map((row) => row.map(String).map(val => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
};

export const downloadCSV = (apiData: any, filename = "participants.csv") => {
  const results = Array.isArray(apiData) ? apiData : apiData?.results;

  if (!results || !Array.isArray(results)) {
    console.error("No valid data to export.");
    return;
  }

  const flattened = flattenParticipantData(results);
  const csvContent = "\uFEFF" + convertToCSV(flattened);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

  
  