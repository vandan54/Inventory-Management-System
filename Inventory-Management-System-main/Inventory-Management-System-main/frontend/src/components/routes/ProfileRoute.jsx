import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

export default function ProfileRoute({children}) {
    const {user} = useUser();

    if(!user) {
        return <Navigate to="/login"/>
    }

    if (user.profileCompleted === 1) {
        return <Navigate to={`/${user.role}/dashboard`} />;
    }

    return children;
}