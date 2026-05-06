import { queryString } from "../../utils/queryString";
import DashboardUI from "./DashboardUI";

export default async function Dashboard() {
  
  const queryObj = {
    action: 'read',
    sheet: 'all',
    limit: 10,
  };
  console.log('Query Object:', queryObj);

  const response = await queryString(queryObj);
  console.log('API Response:', response);

  return (
    <div className="w-full max-w-4xl p-4 bg-white rounded-lg shadow">
      <DashboardUI data={response} />
    </div>
  );
}