import { Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/Home";
import { RoomPage } from "./pages/Room";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/room/:roomId" element={<RoomPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}