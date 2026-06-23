import { createContext, useContext, useState } from 'react';

const UserContext = createContext();

export function UserProvider({ children }   ) {
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser({...userData});
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <UserContext.Provider value={{ user, login, logout }}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    return useContext(UserContext);
}