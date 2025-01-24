// import React from 'react';
// import { getParticipants } from '@/app/actions/participantActions';
// import ParticipantTable from './ParticipantTable';

// export default async function ParticipantsPage() {
//   const { participants, total } = await getParticipants();

//   return (
//     <div className="container mx-auto p-4">
//       <h1 className="text-2xl font-bold mb-4">Participants</h1>
//       <ParticipantTable
//         initialParticipants={participants}
//         totalParticipants={total}
//       />
//     </div>
//   );
// }

import { ParticipantsTable } from './ParticipantTable';
import staticParticipants from './staticParticipants';

export default function ParticipantsPage() {
  return <ParticipantsTable data={staticParticipants} />;
}
