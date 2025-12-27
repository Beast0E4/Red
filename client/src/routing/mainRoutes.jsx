import { Route, Routes } from "react-router-dom";

import Signup from "../pages/Signup";
import Login from "../pages/Login";
import Chat from "../pages/Chat";
import ProfileSettings from "../pages/ProfileSettings";

function MainRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Chat />} />
        <Route path="/create-account" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/settings" element={<ProfileSettings />} />
    </Routes>
  );
}

export default MainRoutes;
