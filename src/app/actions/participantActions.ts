'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { useEffect, useState } from 'react';

const API_BASE_URL ="https://web3bridgewebsitebackend.onrender.com"

const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  gender: z.string(),
  country: z.string(),
  role: z.string(),
  attendance: z.number()
});

const [token, setToken] = useState("")
useEffect(() => {
  const token = localStorage.getItem("token") || "";
  setToken(token)
}, []);


export async function getParticipants() {
  const url = `${API_BASE_URL}/cohort/participant/all/`;
  

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
          "Authorization": `${token}`, 
        },
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch participants');
    }

    const responseData = await response.json();
    return responseData.data.results || [];
  } catch (error) {
    console.error('Fetch participants error:', error);
    return [];
  }
}

export async function updateParticipant(participant: z.infer<typeof ParticipantSchema>) {
  try {
    const validatedData = ParticipantSchema.parse(participant);

    const response = await fetch(`${API_BASE_URL}/cohort/participant/${validatedData.id}/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
          "Authorization": `${token}`, 
        },
      body: JSON.stringify(validatedData)
    });

    if (!response.ok) {
      throw new Error('Failed to update participant');
    }

    revalidatePath('/Participants');
    return { success: true };
  } catch (error) {
    console.error('Update participant error:', error);
    return { error: 'Failed to update participant' };
  }
}

export async function deleteParticipant(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v2/cohort/participant/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
          "Authorization": `${token}`, 
        },
    });

    if (!response.ok) {
      throw new Error('Failed to delete participant');
    }

    revalidatePath('/Participants');
    return { success: true };
  } catch (error) {
    console.error('Delete participant error:', error);
    return { error: 'Failed to delete participant' };
  }
}