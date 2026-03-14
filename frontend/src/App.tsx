import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/LoginPage/Login";

/* ========================= */
/* AOCC IMPORTS */
/* ========================= */
import AOCCDashboard from "./pages/AOCCDashboard/Dashboard";
import BayManagementPage from "./pages/AOCCDashboard/BayManagementPage";
import TimelinePage from "./pages/AOCCDashboard/TimelinePage";
import AuditLogPage from "./pages/AOCCDashboard/AuditLogPage";
import PriorityPage from "./pages/AOCCDashboard/PriorityPage";
import ATCPage from "./pages/AOCCDashboard/ATCPage";
import AirlinePage from "./pages/AOCCDashboard/AirlinePage";
import ApronPage from "./pages/AOCCDashboard/ApronPage";
import AirlineDashboard from "./pages/AirlineDashboard/AirlineDashboard";
import FlightsPage from "./pages/AirlineDashboard/FlightsPage";
import CreateFlightPage from "./pages/AirlineDashboard/CreateFlightPage";
import BulkUploadPage from "./pages/AirlineDashboard/BulkUploadPage";

/* ========================= */
/* APRON IMPORT */
/* ========================= */
import ApronDashboard from "./pages/ApronDashboard/ApronDashboard";

/* ========================= */
/* ATC IMPORTS */
/* ========================= */
import ATCLayout from "./pages/ATCDashboard/ATCLayout";
import ArrivalMonitoring from "./pages/ATCDashboard/ArrivalMonitoring";
import DepartureMonitoring from "./pages/ATCDashboard/DepartureMonitoring";
import BayVisibility from "./pages/ATCDashboard/BayVisibility";
import AlertsSafety from "./pages/ATCDashboard/AlertsSafety";
import EventTimeline from "./pages/ATCDashboard/EventTimeline";
import Communication from "./pages/ATCDashboard/Communication";
import EmergencyControl from "./pages/ATCDashboard/EmergencyControl";
import AOCCCoordination from "./pages/ATCDashboard/AOCCCoordination";

/* ========================= */
/* AUTH */
/* ========================= */
import ProtectedRoute from "./auth/ProtectedRoute";
import RoleRoute from "./auth/RoleRoute";

export default function App() {
  return (
    <Routes>

      {/* ========================= */}
      {/* DEFAULT */}
      {/* ========================= */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ========================= */}
      {/* LOGIN */}
      {/* ========================= */}
      <Route path="/login" element={<Login />} />

      {/* ========================= */}
      {/* AOCC ROUTES */}
      {/* ========================= */}
      <Route
        path="/aocc"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <AOCCDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/bay-management"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <BayManagementPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/timeline"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <TimelinePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/audit-log"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <AuditLogPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/priority"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <PriorityPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/atc"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <ATCPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/airline"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <AirlinePage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      <Route
        path="/aocc/apron"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["AOCC_CONTROLLER"]}>
              <ApronPage />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* APRON ROUTE */}
      {/* ========================= */}
      <Route
        path="/apron"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["APRON_CONTROLLER"]}>
              <ApronDashboard />
            </RoleRoute>
          </ProtectedRoute>
        }
      />

      {/* ========================= */}
      {/* ✅ ATC ROUTES (FIXED PROPERLY) */}
      {/* ========================= */}
      <Route
        path="/atc"
        element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={["ATC_CONTROLLER"]}>
              <ATCLayout />
            </RoleRoute>
          </ProtectedRoute>
        }
      >
        {/* Default redirect */}
        <Route index element={<Navigate to="arrivals" replace />} />

        <Route path="arrivals" element={<ArrivalMonitoring />} />
        <Route path="departures" element={<DepartureMonitoring />} />
        <Route path="bays" element={<BayVisibility />} />
        <Route path="alerts" element={<AlertsSafety />} />
        <Route path="timeline" element={<EventTimeline />} />
        <Route path="communication" element={<Communication />} />
        <Route path="emergency" element={<EmergencyControl />} />
        <Route path="aocc" element={<AOCCCoordination />} />
      </Route>

<Route
  path="/airline"
  element={
    <ProtectedRoute>
      <RoleRoute allowedRoles={["AIRLINE"]}>
        <AirlineDashboard />
      </RoleRoute>
    </ProtectedRoute>
  }
>
  <Route index element={<Navigate to="dashboard" replace />} />
   <Route path="dashboard" element={<div />} />
  <Route path="flights" element={<FlightsPage />} />
  <Route path="create" element={<CreateFlightPage />} />
  <Route path="bulk-upload" element={<BulkUploadPage />} />
</Route>

      {/* ========================= */}
      {/* FALLBACK */}
      {/* ========================= */}
      <Route path="*" element={<div>Page Not Found</div>} />

    </Routes>
  );
}