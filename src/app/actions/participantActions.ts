'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const ParticipantSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  gender: z.string(),
  country: z.string(),
  course: z.string(),
  // attendance: z.number()
});

export async function getParticipants() {
  const url = 'https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/participant/all/'

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
        'Content-Type': 'application/json'
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
    const response = await fetch(
      `${API_BASE_URL}/cohort/participant/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
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