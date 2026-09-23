"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AdminModeContextValue {
  isAdmin: boolean;
  editing: boolean;
  toggleEditing: () => void;
}

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <AdminModeContext.Provider
      value={{
        isAdmin,
        // isAdmin gates this even if editing state were ever true, since
        // this value only controls whether edit UI renders, never authorization.
        editing: isAdmin && editing,
        toggleEditing: () => setEditing((prev) => !prev),
      }}
    >
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() {
  const context = useContext(AdminModeContext);
  if (!context) {
    throw new Error("useAdminMode must be used within an AdminModeProvider");
  }
  return context;
}
