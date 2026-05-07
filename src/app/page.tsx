import Image from "next/image";
import Dashboard from "./components/section/Dashboard";
import { queryString } from "./utils/queryString";

export default async function Home() {


  return (
      <Dashboard />
  );
}
