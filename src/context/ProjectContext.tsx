'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ProjectContextType {
    activeProjectId: string | null;
    setActiveProjectId: (id: string | null) => void;
    projectSlug: string | null;
    setProjectSlug: (slug: string | null) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
    const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
    const [projectSlug, setProjectSlugState] = useState<string | null>(null);

    // Initialize from sessionStorage to survive page refreshes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedId = sessionStorage.getItem('activeProjectId');
            const storedSlug = sessionStorage.getItem('projectSlug');
            if (storedId) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setActiveProjectIdState(storedId);
            }
            if (storedSlug) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setProjectSlugState(storedSlug);
            }
        }
    }, []);

    const setActiveProjectId = (id: string | null) => {
        setActiveProjectIdState(id);
        if (typeof window !== 'undefined') {
            if (id) {
                sessionStorage.setItem('activeProjectId', id);
            } else {
                sessionStorage.removeItem('activeProjectId');
            }
        }
    };

    const setProjectSlug = (slug: string | null) => {
        setProjectSlugState(slug);
        if (typeof window !== 'undefined') {
            if (slug) {
                sessionStorage.setItem('projectSlug', slug);
            } else {
                sessionStorage.removeItem('projectSlug');
            }
        }
    };

    return (
        <ProjectContext.Provider value={{ 
            activeProjectId, 
            setActiveProjectId, 
            projectSlug, 
            setProjectSlug 
        }}>
            {children}
        </ProjectContext.Provider>
    );
}

export function useProjectContext() {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjectContext must be used within a ProjectProvider');
    }
    return context;
}
