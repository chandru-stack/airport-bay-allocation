import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./authContext";

// allowedRoles: ["AIRLINE"] etc.
export default function RoleRoute({ allowedRoles, children }) {
  const { isAuthed, roleName } = useAuth();

  if (!isAuthed) return <Navigate to="/login" replace />;

  // role-based access check uses roleName (from user.role_name OR fallback ROLE_BY_ID[user.role_id])
  if (allowedRoles && !allowedRoles.includes(roleName)) {
    if (roleName === "AIRLINE") return <Navigate to="/home" replace />;
    if (roleName === "AOCC") return <Navigate to="/aocc" replace />;
    return <Navigate to="/login" replace />;
  }

  // IMPORTANT: nested routes render here
  return children ?? <Outlet />;
}
