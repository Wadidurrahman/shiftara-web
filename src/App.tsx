import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/app/layout"; 
import Dashboard from "@/app/page";
import Schedule from "@/pages/Schedule";
import Karyawan from "@/app/employees/page";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout><Routes>
        <Route index element={<Dashboard />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="employees" element={<Karyawan />} />
        </Routes></MainLayout>}>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;