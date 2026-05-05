// src/hooks/useLicence.jsx
// PUBLIC STUB — Hardcoded for Community Edition
import React, { createContext, useContext, useState } from "react";

const LicenceContext = createContext(null);

export function LicenceProvider({ children }) {
  // Hardcoded Community Status for Open Source
  const [status] = useState({
    tier: 'community',
    activated: false,
    deep_dive_bundled: false,
    report_brand_price: 0
  });

  const activate = async () => { 
    console.warn("Activation logic is only available in the commercial Desktop/Pro editions."); 
  };
  
  const deactivate = async () => {};
  const activatePlugin = async () => {};

  return (
    <LicenceContext.Provider value={{ status, activate, deactivate, activatePlugin, loading: false, error: null }}>
      {children}
    </LicenceContext.Provider>
  );
}

export function useLicence() {
  const ctx = useContext(LicenceContext);
  if (!ctx) throw new Error("useLicence must be used within LicenceProvider");
  return ctx;
}

export function RequiresTier({ tier, children, fallback }) {
  return tier === 'community' ? <>{children}</> : <>{fallback}</>;
}
