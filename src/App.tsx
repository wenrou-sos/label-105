import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import MainLayout from "@/components/Layout/MainLayout";
import ProtectedRoute from "@/components/ProtectedRoute";

import CustomerList from "@/pages/customers/CustomerList";
import CustomerForm from "@/pages/customers/CustomerForm";
import CustomerDetail from "@/pages/customers/CustomerDetail";
import ConsultationForm from "@/pages/customers/ConsultationForm";
import PhotoUpload from "@/pages/customers/PhotoUpload";
import TagManagement from "@/pages/customers/TagManagement";

import SurgeryList from "@/pages/surgeries/SurgeryList";
import SurgeryForm from "@/pages/surgeries/SurgeryForm";
import ConsentFormPage from "@/pages/surgeries/ConsentForm";
import SupplyManagement from "@/pages/surgeries/SupplyManagement";

import PostOpList from "@/pages/postoperative/PostOpList";
import VisitForm from "@/pages/postoperative/VisitForm";
import ComplicationForm from "@/pages/postoperative/ComplicationForm";
import PhotoCompare from "@/pages/postoperative/PhotoCompare";

import MedicineList from "@/pages/medicines/MedicineList";
import ScanInbound from "@/pages/medicines/ScanInbound";
import ScanOutbound from "@/pages/medicines/ScanOutbound";
import TraceQuery from "@/pages/medicines/TraceQuery";

import UserManagement from "@/pages/system/UserManagement";
import RoleManagement from "@/pages/system/RoleManagement";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            
            <Route path="/customers">
              <Route index element={<CustomerList />} />
              <Route path="tags" element={<TagManagement />} />
              <Route path="new" element={<CustomerForm />} />
              <Route path=":id" element={<CustomerDetail />} />
              <Route path=":id/edit" element={<CustomerForm />} />
              <Route path=":id/consultation" element={<ConsultationForm />} />
              <Route path=":id/photos" element={<PhotoUpload />} />
            </Route>
            
            <Route path="/surgeries">
              <Route index element={<SurgeryList />} />
              <Route path="new" element={<SurgeryForm />} />
              <Route path=":id/edit" element={<SurgeryForm />} />
              <Route path=":id/consent" element={<ConsentFormPage />} />
              <Route path=":id/supplies" element={<SupplyManagement />} />
            </Route>
            
            <Route path="/postoperative">
              <Route index element={<PostOpList />} />
              <Route path="visit/new" element={<VisitForm />} />
              <Route path="visit/:id/edit" element={<VisitForm />} />
              <Route path="complications" element={<ComplicationForm />} />
              <Route path="photo-compare" element={<PhotoCompare />} />
              <Route path=":surgeryId/visit" element={<VisitForm />} />
              <Route path=":surgeryId/visit/:id" element={<VisitForm />} />
              <Route path=":surgeryId/complication" element={<ComplicationForm />} />
              <Route path=":surgeryId/compare" element={<PhotoCompare />} />
            </Route>
            
            <Route path="/medicines">
              <Route index element={<MedicineList />} />
              <Route path="scan/inbound" element={<ScanInbound />} />
              <Route path="scan/outbound" element={<ScanOutbound />} />
              <Route path="trace" element={<TraceQuery />} />
              <Route path="trace/:code" element={<TraceQuery />} />
            </Route>
            
            <Route path="/system">
              <Route path="users" element={<UserManagement />} />
              <Route path="roles" element={<RoleManagement />} />
            </Route>
          </Route>
        </Route>
        
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
