import { Navigate } from "react-router-dom";

/**
 * Index page - redirects to the Landing page
 * The main app entry point is the Landing page (/)
 */
export default function Index() {
  return <Navigate to="/" replace />;
}
