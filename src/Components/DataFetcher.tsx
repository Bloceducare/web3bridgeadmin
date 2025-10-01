"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Registration {
  id: number;
  name: string;
  email: string;
  phone: number;
  country: string;
  location: string;
  gender: string;
  telegramusername: string;
  xhandle: string;
  role: string;
}

interface Speaker {
  id: number;
  name: string;
}

interface DataContextProps {
  registrations: Registration[];
  speakers: Speaker[];
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

interface DataFetcherProps {
  children: ReactNode;
}

const DataFetcher: React.FC<DataFetcherProps> = ({ children }) => {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const generalRegistrations = await fetch('https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/general-registrations/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const speakerRegistrations = await fetch('https://testy-leonanie-web3bridge-3c7204a2.koyeb.app/api/v2/speaker-registrations/', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const generalData: Registration[] = await generalRegistrations.json();
        const speakerData: Speaker[] = await speakerRegistrations.json();
        
        setRegistrations(generalData);  
        setSpeakers(speakerData);  
      } catch (error) {
        console.error('Error fetching registration data:', error);
      }
    }

    fetchRegistrations();
  }, []);

  return (
    <DataContext.Provider value={{ registrations, speakers }}>
      {children}
    </DataContext.Provider>
  );
};

const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataFetcher');
  }
  return context;
};

export { DataFetcher, useData };
