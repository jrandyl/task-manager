import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="block relative overflow-hidden h-auto w-full min-h-svh">
      <Outlet />
    </div>
  );
}

export default Layout;
