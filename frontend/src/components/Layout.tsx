import { NavLink, Outlet } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "btn-lg inline-flex items-center",
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-100",
        ].join(" ")
      }
    >
      {children}
    </NavLink>
  );
}

export default function Layout() {
  return (
    <div className="app-root">
      <header className="border-b border-blue-100 bg-white">
        <div className="container-app flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-lg font-extrabold tracking-tight text-slate-900">
              Airport Operations Portal
            </div>
            <div className="text-xs text-slate-500">
              Airport Authority of India • Airline Desk
            </div>
          </div>

          <nav className="flex flex-wrap gap-2">
            <NavItem to="/home">Home</NavItem>
            <NavItem to="/flights">Flights</NavItem>
            <NavItem to="/create">Create Flight</NavItem>
            <NavItem to="/bulk">Bulk Upload (CSV)</NavItem>
          </nav>
        </div>
      </header>

      <main className="container-app py-8">
        <Outlet />
      </main>
    </div>
  );
}
