import Image from "next/image";
import Dashboard from "./components/section/Dashboard";
import { queryString } from "./utils/queryString";

export default async function Home() {


  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans ">

      <Dashboard />
      
    </div>
  );
}
