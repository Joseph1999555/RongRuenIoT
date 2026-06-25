import type { Metadata } from "next";
import Dashboard from "./components/section/Dashboard";

export const metadata: Metadata = {
  title: "Smart Farm Dashboard",
};

export default function Home() {
  return (
      <Dashboard />
  );
}
