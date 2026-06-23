import { useContext, createContext, useState } from "react";

const AlertContext = createContext();

export function AlertProvider({children}) {
    const [alert, setAlert] = useState(null);

    const showAlert = (title, message, type = 'info', autoClose = true) => {
        setAlert({ title, message, type, autoClose });
    };

    const closeAlert = () => {
        setAlert(null);
    };

    return (
        <AlertContext.Provider value={{alert, showAlert, closeAlert}}>
            {children}
        </AlertContext.Provider>
    );
}

export function useAlert() {
    return useContext(AlertContext);
}