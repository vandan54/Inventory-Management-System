import { createContext, useContext, useState } from "react";

const ProgressBarContext = createContext();

export const ProgressBarProvider = ({children}) => {
    const [progress, setProgress] = useState(0);
    const [isVisible, setIsVisible] = useState(false);

    const start = () => {
        setIsVisible(true);
        setProgress(10);

        if (window.progressInterval) {
            clearInterval(window.progressInterval);
        }

        const interval = setInterval(() => {
            setProgress(prev => {
                if(prev >= 90) {
                    clearInterval(interval);
                    return 90;
                }
                return Math.min(prev + Math.random() * 30, 90);
            });
        }, 200);

        window.progressInterval = interval;
    }

    const complete = () => {

        if (window.progressInterval) {
            clearInterval(window.progressInterval);
        }

        setProgress(100);
        setTimeout(() => {
            setIsVisible(false);
            setProgress(0);
        }, 300);
    }

    return <ProgressBarContext.Provider value={{progress, isVisible, start, complete}}>
        {children}
    </ProgressBarContext.Provider>
}

export const useProgressBar = () => {
    return useContext(ProgressBarContext);
}