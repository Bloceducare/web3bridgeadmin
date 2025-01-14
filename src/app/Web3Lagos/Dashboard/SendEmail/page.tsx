"use client"

import React, { useState } from 'react';

function Page() {
  const [message, setMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (message.trim() === '') {
      setStatusMessage('Message cannot be empty!');
      setIsSuccess(false);
      return;
    }

    const messageData = { message };

    try {
        console.log(messageData)
      const response = await fetch('https://web3bridgewebsitebackend.onrender.com/api/v2/cohort/bulk-email/send_bulk_email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (response.ok) {
        setMessage('');
        setStatusMessage('Message sent successfully!');
        setIsSuccess(true);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      setStatusMessage('Error sending message. Please try again.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="w-full overflow-hidden h-full p-4">
      <div className='text-2xl font-semibold'>
        <h1>Send Emails</h1>
      </div>

      <section className="flex justify-center mt-10">
        <div className="border shadow-xl w-10/12 flex flex-col space-y-8 p-10 rounded-xl">
          <form onSubmit={handleSubmit}>
            <div className='flex flex-col gap-4'>
              <label className='text-black'>Write your message</label>
              <textarea
                placeholder="Write your message"
                value={message}
                onChange={handleChange}
                className="w-full h-[25vh] p-4 border-2 border-gray-300 rounded-lg outline-none resize-none"
              />
            </div>

            <button type="submit" className='mt-5 bg-green-700 px-6 py-2 rounded-lg text-white'>
              Send Message
            </button>
          </form>
        </div>
      </section>

      {/* Status Message */}
      <div className='flex justify-center mt-5'>
        {statusMessage && (
          <div
            style={{
              marginTop: '10px',
              padding: '10px',
              borderRadius: '5px',
              width: '80%',
              backgroundColor: isSuccess ? '#d4edda' : '#f8d7da',
              color: isSuccess ? '#155724' : '#721c24',
              textAlign: 'center',
              fontWeight: 'bold',
            }}
          >
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  );
}

export default Page;

