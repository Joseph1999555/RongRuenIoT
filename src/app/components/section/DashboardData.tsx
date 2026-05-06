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
    limit: 10,
  };

  const baseUrl = "https://script.google.com/macros/s/AKfycbynj8rEVT7HX2x920JbZSi_rVz7qPqlEnufCDSNsPxPFYKLndczSRoaPgVQ1cUVRSUB/exec";
  const paramsStr = queryString(queryObj);

  // โยน API_URL ที่ประกอบเสร็จแล้วให้ SWR ทำงาน
  const { data, error, isLoading } = useSWR(
    ['dashboard-data', queryObj], 
    ([_, params]) => queryString(params), // 👈 เรียกฟังก์ชันของคุณตรงนี้
    { refreshInterval: 60000 }
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
    <div className="relative">
      {/* 🔴 ป้ายบอกสถานะ Real-time แปะไว้มุมขวาบนของ Dashboard */}
      <div className="absolute top-6 right-6 md:top-8 md:right-8 z-10 flex items-center gap-2 bg-white px-3 py-1.5 rounded-full shadow-sm border border-gray-100">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
        </span>
        <span className="text-xs font-medium text-gray-500">Live Sync</span>
      </div>

      <DashboardUI data={data} />
    </div>
  );
}