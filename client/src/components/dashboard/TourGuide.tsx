'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTour } from '@/context/TourContext';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export default function TourGuide() {
    const { isTourActive, currentStepIndex, steps, nextStep, prevStep, skipTour, isLastStep } = useTour();
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const [finalPosition, setFinalPosition] = useState<'top' | 'bottom'>('bottom');
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const currentStep = steps[currentStepIndex];

    useEffect(() => {
        if (isTourActive && currentStep) {
            const updatePosition = () => {
                const element = document.querySelector(currentStep.target);
                if (element) {
                    const rect = element.getBoundingClientRect();
                    const cardHeight = 320; // Increased estimate to be safer
                    const padding = 24;
                    const viewportHeight = window.innerHeight;

                    // Improved Flipping logic: 
                    // 1. If there's no space below AND space above is better, flip.
                    // 2. If the element is too tall (>60% of viewport), pin to the top or middle.
                    const spaceBelow = viewportHeight - rect.bottom;
                    const spaceAbove = rect.top;

                    const shouldFlip = spaceBelow < (cardHeight + padding) && spaceAbove > spaceBelow;
                    setFinalPosition(shouldFlip ? 'top' : 'bottom');

                    setCoords({
                        top: rect.top,
                        left: rect.left,
                        width: rect.width,
                        height: rect.height,
                    });

                    // Scroll to ensure the element AND the card are likely visible
                    // If flipping to top, we want to see the top of the element.
                    // If going to bottom, we want to see the top of the element.
                    element.scrollIntoView({
                        behavior: 'smooth',
                        block: rect.height > viewportHeight * 0.7 ? 'start' : 'center'
                    });
                } else {
                    setCoords({
                        top: window.innerHeight / 2,
                        left: window.innerWidth / 2,
                        width: 0,
                        height: 0,
                    });
                    setFinalPosition('bottom');
                }
            };

            updatePosition();
            const timer = setTimeout(updatePosition, 100); // Re-check after scroll/layout sync
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition);
            return () => {
                clearTimeout(timer);
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition);
            };
        }
    }, [isTourActive, currentStep, currentStepIndex]);

    if (!isMounted) return null;

    if (!isMounted) return null;

    return (
        <AnimatePresence>
            {isTourActive && (
                <div
                    className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden"
                    aria-hidden="true"
                >
                    {/* Spotlight / Overlay - Now captures clicks to exit safely */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={skipTour}
                        className="absolute inset-0 bg-black/70 backdrop-blur-[6px] pointer-events-auto cursor-pointer"
                        style={{
                            clipPath: coords.width > 0
                                ? (() => {
                                    const p = 12; // Padding
                                    const l = coords.left - p;
                                    const t = coords.top - p;
                                    const r = coords.left + coords.width + p;
                                    const b = coords.top + coords.height + p;
                                    return `polygon(0% 0%, 0% 100%, ${l}px 100%, ${l}px ${t}px, ${r}px ${t}px, ${r}px ${b}px, ${l}px ${b}px, ${l}px 100%, 100% 100%, 100% 0%)`;
                                })()
                                : 'none'
                        }}
                    />

                    {/* Target Highlight Ring */}
                    {coords.width > 0 && (
                        <motion.div
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
                            className="absolute border-2 border-cyan-400/50 rounded-2xl shadow-[0_0_40px_rgba(34,211,238,0.4)] pointer-events-none"
                            style={{
                                top: coords.top - 12,
                                left: coords.left - 12,
                                width: coords.width + 24,
                                height: coords.height + 24,
                            }}
                        >
                            <div className="absolute inset-0 rounded-2xl animate-pulse bg-cyan-400/10" />
                        </motion.div>
                    )}

                    {/* Guide Card Container - Only render if currentStep exists */}
                    {currentStep && (
                        <div
                            className="absolute transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] pointer-events-auto"
                            style={{
                                top: finalPosition === 'top'
                                    ? coords.top - 20
                                    : coords.top + coords.height + 20,
                                left: coords.left + coords.width / 2,
                                transform: finalPosition === 'top'
                                    ? 'translateX(-50%) translateY(-100%)'
                                    : 'translateX(-50%)',
                                width: '340px'
                            }}
                        >
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentStepIndex}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="relative p-[1px] rounded-[24px] overflow-hidden"
                                >
                                    {/* Animated Border Glow */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-500 animate-[spin_4s_linear_infinite]" style={{ transform: 'scale(2)' }} />

                                    <div className="relative bg-[#0d0d0f]/90 backdrop-blur-2xl rounded-[23px] p-6 shadow-2xl border border-white/10">
                                        {/* Decorative Sparkle */}
                                        <div className="absolute -top-1 -right-1 w-12 h-12 bg-cyan-500/20 blur-xl rounded-full" />

                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                                                <Sparkles className="w-4 h-4 text-cyan-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/80">Guide Mode • {currentStepIndex + 1}/{steps.length}</span>
                                        </div>

                                        <h4 className="text-lg font-black text-white mb-2 tracking-tight">{currentStep.title}</h4>
                                        <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium">
                                            {currentStep.content}
                                        </p>

                                        <div className="flex items-center justify-between mt-auto">
                                            <button
                                                onClick={skipTour}
                                                className="text-[11px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors"
                                            >
                                                Skip Tour
                                            </button>

                                            <div className="flex items-center gap-2">
                                                {currentStepIndex > 0 && (
                                                    <button
                                                        onClick={prevStep}
                                                        className="p-2 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all border border-white/5"
                                                    >
                                                        <ChevronLeft className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (isLastStep) {
                                                            skipTour(); // Immediate exit call
                                                        } else {
                                                            nextStep();
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all active:scale-95"
                                                >
                                                    {isLastStep ? 'Finish' : 'Next'} <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Close Button */}
                                        <button
                                            onClick={skipTour}
                                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
        </AnimatePresence>
    );
}
