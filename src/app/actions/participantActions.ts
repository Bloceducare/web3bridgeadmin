'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getParticipants(page = 1, limit = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/cohort/participant/all?page=${page}&limit=${limit}`, {
        method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch participants');
    }

    return response.json();
  } catch (error) {
    console.error('Fetch participants error:', error);
    return { participants: [], total: 0 };
  }
}

export async function updateParticipant(id: string, formData: FormData) {
  const participantData = {
    name: formData.get('name'),
    email: formData.get('email'),
    gender: formData.get('gender'),
    country: formData.get('country'),
    role: formData.get('role')
  };

  try {
    const response = await fetch(`${API_BASE_URL}/cohort/participant/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(participantData)
    });

    if (!response.ok) {
      throw new Error('Failed to update participant');
    }

    revalidatePath('/participants');
    redirect('/participants');
  } catch (error) {
    console.error('Update participant error:', error);
    return { error: 'Failed to update participant' };
  }
}

export async function deleteParticipant(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/cohort/participant/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete participant');
    }

    revalidatePath('/participants');
  } catch (error) {
    console.error('Delete participant error:', error);
    return { error: 'Failed to delete participant' };
  }
}