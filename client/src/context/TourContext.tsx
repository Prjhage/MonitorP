'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface TourStep {
    target: string; // CSS selector or ID
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void; // Optional action to run before/during this step
}

interface TourContextType {
    isTourActive: boolean;
    currentStepIndex: number;
    steps: TourStep[];
    startTour: (tourSteps: TourStep[]) => void;
    nextStep: () => void;
    prevStep: () => void;
    skipTour: () => void;
    isLastStep: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
    const [isTourActive, setIsTourActive] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [steps, setSteps] = useState<TourStep[]>([]);

    const startTour = (tourSteps: TourStep[]) => {
        setSteps(tourSteps);
        setCurrentStepIndex(0);
        setIsTourActive(true);
        // Run action for first step if it exists
        if (tourSteps[0]?.action) {
            tourSteps[0].action();
        }
    };

    const nextStep = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextIdx = currentStepIndex + 1;
            // Run action for next step if it exists
            if (steps[nextIdx]?.action) {
                steps[nextIdx].action();
                // Brief delay to allow DOM to catch up to state changes from action
                setTimeout(() => {
                    setCurrentStepIndex(nextIdx);
                }, 50);
            } else {
                setCurrentStepIndex(nextIdx);
            }
        } else {
            finishTour();
        }
    };

    const prevStep = () => {
        if (currentStepIndex > 0) {
            const prevIdx = currentStepIndex - 1;
            // Run action for previous step if it exists
            if (steps[prevIdx]?.action) {
                steps[prevIdx].action();
                // Brief delay to allow DOM to catch up
                setTimeout(() => {
                    setCurrentStepIndex(prevIdx);
                }, 50);
            } else {
                setCurrentStepIndex(prevIdx);
            }
        }
    };

    const finishTour = () => {
        setIsTourActive(false);
        // Important: We DON'T clear steps or index immediately.
        // This keeps the 'currentStep' valid during the Framer Motion exit animation.
        // We cleanup after the animation is guaranteed to be done.
        setTimeout(() => {
            setSteps([]);
            setCurrentStepIndex(0);
        }, 1000);
    };

    const skipTour = () => {
        finishTour();
    };

    const isLastStep = steps.length > 0 && currentStepIndex === steps.length - 1;

    return (
        <TourContext.Provider value={{
            isTourActive,
            currentStepIndex,
            steps,
            startTour,
            nextStep,
            prevStep,
            skipTour,
            isLastStep
        }}>
            {children}
        </TourContext.Provider>
    );
}

export function useTour() {
    const context = useContext(TourContext);
    if (context === undefined) {
        throw new Error('useTour must be used within a TourProvider');
    }
    return context;
}
