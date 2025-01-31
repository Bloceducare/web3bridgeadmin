import React from "react";
import { getParticipants } from "@/app/actions/participantActions";
import { ParticipantsTable } from "./ParticipantTable";

export default async function ParticipantsPage() {
  // const participants = await getParticipants();

  return (
    <div className="container mx-auto p-4">
      {/* <h1 className="text-2xl font-bold mb-4">Participants</h1> */}
      {/* <ParticipantsTable data={participants} /> */}
    </div>
  );
}

// import { ParticipantsTable } from "./ParticipantTable";
// import staticParticipants from "./staticParticipants";

// export default function ParticipantsPage() {
//   return <ParticipantsTable data={staticParticipants} />;
// }
