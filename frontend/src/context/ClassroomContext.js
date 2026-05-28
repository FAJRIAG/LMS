'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ClassroomContext = createContext();

export function ClassroomProvider({ children }) {
    const { user } = useAuth();
    const [activeClassId, setActiveClassId] = useState(null);

    useEffect(() => {
        if (!user) return;

        if (user.role === 'dosen') {
            const taught = user.taught_classrooms || [];
            if (taught.length > 0) {
                const cached = localStorage.getItem('activeClassId');
                const parsed = cached ? parseInt(cached) : null;
                const isValid = taught.some(c => c.id === parsed);

                if (isValid) {
                    setActiveClassId(parsed);
                } else {
                    setActiveClassId(taught[0].id);
                    localStorage.setItem('activeClassId', taught[0].id);
                }
            }
        } else {
            const enrolled = user.classrooms || [];
            if (enrolled.length > 0) {
                const cached = localStorage.getItem('activeClassId');
                const parsed = cached ? parseInt(cached) : null;
                const isValid = enrolled.some(c => c.id === parsed);

                if (isValid) {
                    setActiveClassId(parsed);
                } else {
                    setActiveClassId(enrolled[0].id);
                    localStorage.setItem('activeClassId', enrolled[0].id);
                }
            }
        }
    }, [user]);

    const changeClass = (id) => {
        setActiveClassId(parseInt(id));
        localStorage.setItem('activeClassId', id);
    };

    return (
        <ClassroomContext.Provider value={{ activeClassId, changeClass }}>
            {children}
        </ClassroomContext.Provider>
    );
}

export function useClassroom() {
    return useContext(ClassroomContext);
}
