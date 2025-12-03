import Chart from "react-apexcharts";
import {ApexOptions} from "apexcharts";
import {Dropdown} from "../../ui/dropdown/Dropdown.tsx";
import {DropdownItem} from "../../ui/dropdown/DropdownItem.tsx";
import {MoreDotIcon} from "../../../icons";
import {useEffect, useState} from "react";
import {
    getMonthlySalesChart as fetchMonthlySalesChart,
    type MonthlySalesChart as MonthlySalesChartData
} from "../../../services/dashboardService";

export default function MonthlySalesChart() {
    const defaultMonths = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    const [labels, setLabels] = useState<string[]>(defaultMonths);
    const [values, setValues] = useState<number[]>(new Array(defaultMonths.length).fill(0));
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const token = localStorage.getItem("token") || "";

        const load = async () => {
            try {
                setLoading(true);
                const data: MonthlySalesChartData = await fetchMonthlySalesChart(token);
                const newLabels = Array.isArray(data.labels) && data.labels.length ? data.labels : defaultMonths;
                const newValues = Array.isArray(data.values) && data.values.length ? data.values : new Array(newLabels.length).fill(0);
                setLabels(newLabels);
                setValues(newValues);
            } catch (err) {
                console.error("Failed to fetch monthly sales chart:", err);
                // Keep defaults on error
                setLabels(defaultMonths);
                setValues(new Array(defaultMonths.length).fill(0));
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const options: ApexOptions = {
        colors: ["#465fff"],
        chart: {
            fontFamily: "Outfit, sans-serif",
            type: "bar",
            height: 180,
            toolbar: {
                show: false,
            },
        },
        plotOptions: {
            bar: {
                horizontal: false,
                columnWidth: "39%",
                borderRadius: 5,
                borderRadiusApplication: "end",
            },
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 4,
            colors: ["transparent"],
        },
        xaxis: {
            categories: labels,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
        },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "left",
            fontFamily: "Outfit",
        },
        yaxis: {
            title: {
                text: undefined,
            },
        },
        grid: {
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
        fill: {
            opacity: 1,
        },

        tooltip: {
            x: {
                show: false,
            },
            y: {
                formatter: (val: number) => `${val}`,
            },
        },
    };
    const series = [
        {
            name: "Sales",
            data: values,
        },
    ];
    const [isOpen, setIsOpen] = useState(false);

    function toggleDropdown() {
        setIsOpen(!isOpen);
    }

    function closeDropdown() {
        setIsOpen(false);
    }

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                    Monthly Sales
                </h3>
                <div className="relative inline-block">
                    <button className="dropdown-toggle" onClick={toggleDropdown}>
                        <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6"/>
                    </button>
                    <Dropdown
                        isOpen={isOpen}
                        onClose={closeDropdown}
                        className="w-40 p-2"
                    >
                        <DropdownItem
                            onItemClick={closeDropdown}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            View More
                        </DropdownItem>
                        <DropdownItem
                            onItemClick={closeDropdown}
                            className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
                        >
                            Delete
                        </DropdownItem>
                    </Dropdown>
                </div>
            </div>

            <div className="max-w-full overflow-x-auto custom-scrollbar">
                <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
                    {loading ? (
                        <div className="h-[180px] rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"/>
                    ) : (
                        <Chart options={options} series={series} type="bar" height={180}/>
                    )}
                </div>
            </div>
        </div>
    );
}


// import Chart from "react-apexcharts";
// import {ApexOptions} from "apexcharts";
// import {useEffect, useState} from "react";
// import {
//     getMonthlySalesChart as fetchMonthlySalesChart,
//     type MonthlySalesChart as MonthlySalesChartData
// } from "../../../services/dashboardService";
// import ComponentCard from "../../common/ComponentCard.tsx";
//
// export default function MonthlySalesChart() {
//     const defaultMonths = [
//         "Jan",
//         "Feb",
//         "Mar",
//         "Apr",
//         "May",
//         "Jun",
//         "Jul",
//         "Aug",
//         "Sep",
//         "Oct",
//         "Nov",
//         "Dec",
//     ];
//
//     const [labels, setLabels] = useState<string[]>(defaultMonths);
//     const [values, setValues] = useState<number[]>(new Array(defaultMonths.length).fill(0));
//     const [loading, setLoading] = useState<boolean>(true);
//
//     useEffect(() => {
//         const token = localStorage.getItem("token") || "";
//
//         const load = async () => {
//             try {
//                 setLoading(true);
//                 const data: MonthlySalesChartData = await fetchMonthlySalesChart(token);
//                 const newLabels = Array.isArray(data.labels) && data.labels.length ? data.labels : defaultMonths;
//                 const newValues = Array.isArray(data.values) && data.values.length ? data.values : new Array(newLabels.length).fill(0);
//                 setLabels(newLabels);
//                 setValues(newValues);
//             } catch (err) {
//                 console.error("Failed to fetch monthly sales chart:", err);
//                 // Keep defaults on error
//                 setLabels(defaultMonths);
//                 setValues(new Array(defaultMonths.length).fill(0));
//             } finally {
//                 setLoading(false);
//             }
//         };
//
//         load();
//     }, []);
//
//     const options: ApexOptions = {
//         colors: ["#465fff"],
//         chart: {
//             fontFamily: "Outfit, sans-serif",
//             type: "bar",
//             height: 180,
//             toolbar: {
//                 show: false,
//             },
//         },
//         plotOptions: {
//             bar: {
//                 horizontal: false,
//                 columnWidth: "39%",
//                 borderRadius: 5,
//                 borderRadiusApplication: "end",
//             },
//         },
//         dataLabels: {
//             enabled: false,
//         },
//         stroke: {
//             show: true,
//             width: 4,
//             colors: ["transparent"],
//         },
//         xaxis: {
//             categories: labels,
//             axisBorder: {
//                 show: false,
//             },
//             axisTicks: {
//                 show: false,
//             },
//         },
//         legend: {
//             show: true,
//             position: "top",
//             horizontalAlign: "left",
//             fontFamily: "Outfit",
//         },
//         yaxis: {
//             title: {
//                 text: undefined,
//             },
//         },
//         grid: {
//             yaxis: {
//                 lines: {
//                     show: true,
//                 },
//             },
//         },
//         fill: {
//             opacity: 1,
//         },
//
//         tooltip: {
//             x: {
//                 show: false,
//             },
//             y: {
//                 formatter: (val: number) => `${val}`,
//             },
//         },
//     };
//     const series = [
//         {
//             name: "Sales",
//             data: values,
//         },
//     ];
//
//     return (
//         <ComponentCard title="Monthly Sales">
//             <div className="max-w-full overflow-x-auto custom-scrollbar">
//                 <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
//                     {loading ? (
//                         <div className="h-[180px] rounded-md bg-gray-100 dark:bg-gray-800 animate-pulse"/>
//                     ) : (
//                         <Chart options={options} series={series} type="bar" height={180}/>
//                     )}
//                 </div>
//             </div>
//         </ComponentCard>
//     );
// }
