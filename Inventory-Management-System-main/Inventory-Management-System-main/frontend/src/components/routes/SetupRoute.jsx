import { Navigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const SetupRoute = ({ children }) => {
    const { user } = useUser();

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (user.mustChangePassword === 0) {
        return <Navigate to={`/${user.role}/dashboard`} />;
    }

    return children;
};

export default SetupRoute;
