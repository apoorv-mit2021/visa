import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import ChartTab from "../../common/ChartTab.tsx";
import { getSalesRevenueStatistics as fetchSalesRevenueStatistics, type StatisticsChart as StatisticsData } from "../../../services/dashboardService";

export default function StatisticsChart() {
  const defaultMonths = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const [labels, setLabels] = useState<string[]>(defaultMonths);
  const [sales, setSales] = useState<number[]>(new Array(defaultMonths.length).fill(0));
  const [revenue, setRevenue] = useState<number[]>(new Array(defaultMonths.length).fill(0));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const load = async () => {
      try {
        setLoading(true);
        const data: StatisticsData = await fetchSalesRevenueStatistics(token);
        const newLabels = Array.isArray(data.labels) && data.labels.length ? data.labels : defaultMonths;
        const salesData = Array.isArray(data.sales) && data.sales.length ? data.sales : new Array(newLabels.length).fill(0);
        const revenueData = Array.isArray(data.revenue) && data.revenue.length ? data.revenue : new Array(newLabels.length).fill(0);
        setLabels(newLabels);
        setSales(salesData);
        setRevenue(revenueData);
      } catch (err) {
        console.error("Failed to fetch sales/revenue statistics:", err);
        setLabels(defaultMonths);
        setSales(new Array(defaultMonths.length).fill(0));
        setRevenue(new Array(defaultMonths.length).fill(0));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#9CB9FF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: { curve: "straight", width: [2, 2] },
    fill: { type: "gradient", gradient: { opacityFrom: 0.55, opacityTo: 0 } },
    markers: { size: 0, strokeColors: "#fff", strokeWidth: 2, hover: { size: 6 } },
    grid: { xaxis: { lines: { show: false } }, yaxis: { lines: { show: true } } },
    dataLabels: { enabled: false },
    tooltip: { enabled: true, x: { format: "dd MMM yyyy" } },
    xaxis: {
      type: "category",
      categories: labels,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  const series = [
    { name: "Sales", data: sales },
    { name: "Revenue", data: revenue },
  ];
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Statistics</h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">Target you’ve set for each month</p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          {loading ? (
            <div className="h-[310px] rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : (
            <Chart options={options} series={series} type="area" height={310} />
          )}
        </div>
      </div>
    </div>
  );
}
