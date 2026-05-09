"use client";

import React from "react";
import useSWR from "swr";
import DashboardUI from "./DashboardUI";
// Import ฟังก์ชัน queryString ของคุณมาใช้
import { queryString } from "../../utils/queryString";

// Fetcher ยังคงทำหน้าที่แอบแนบเวลา _t ไปเพื่อเจาะ Cache (โดยไม่กระทบ Key ของ SWR)

export default function DashboardData() {
  
  //  สร้าง Object สำหรับกำหนดเงื่อนไขการดึงข้อมูล
  const queryObj = {
    action: 'read',
    sheet: 'all',
    limit: 16,
  };

  // โยน API_URL ที่ประกอบเสร็จแล้วให้ SWR ทำงาน
  const { data, error, isLoading } = useSWR(
    ['dashboard-data', queryObj], 
    ([_, params]) => queryString(params), 
    { refreshInterval: 60000,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        keepPreviousData: true,
     }
  );

  // --- จัดการสถานะ Error ---
  if (error) {
    return (
      <div className="flex h-64 items-center justify-center bg-white rounded-xl shadow-sm text-red-500 font-medium p-6 border border-red-100">
        <div className="text-center">
          <p className="text-2xl mb-2">⚠️</p>
          <p>เกิดข้อผิดพลาดในการดึงข้อมูลจากเซิร์ฟเวอร์</p>
          <p className="text-sm text-red-400 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  // --- จัดการสถานะ Loading ---
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">กำลังซิงค์ข้อมูลจาก Smart Farm...</p>
      </div>
    );
  }

  // --- ข้อมูลพร้อม ส่งให้ UI ไปวาดกราฟ ---
  return (
  
      <DashboardUI data={data} />

  );
}