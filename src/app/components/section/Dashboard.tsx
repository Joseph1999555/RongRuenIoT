import DashboardData from "./DashboardData";

export const metadata = {
  title: "IoT Smart Farm Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="w-full mx-auto">
      <DashboardData />
    </div>
  );
}