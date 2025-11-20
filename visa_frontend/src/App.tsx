import {JSX} from "react";
import {BrowserRouter as Router, Routes, Route, Navigate} from "react-router-dom";
import {AuthProvider, useAuth} from "./context/AuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {Toaster} from "sonner";

// Layouts & Utilities
import AppLayout from "./layout/AppLayout";
import {ScrollToTop} from "./components/common/ScrollToTop";
import Loader from "./components/common/Loader";

// Pages
import SignIn from "./pages/AuthPages/SignIn";
import NotFound from "./pages/OtherPage/NotFound";
import Unauthorized from "./pages/OtherPage/Unauthorized";
import UserProfiles from "./pages/UserProfiles";
import Videos from "./pages/UiElements/Videos";
import Images from "./pages/UiElements/Images";
import Alerts from "./pages/UiElements/Alerts";
import Badges from "./pages/UiElements/Badges";
import Avatars from "./pages/UiElements/Avatars";
import Buttons from "./pages/UiElements/Buttons";
import LineChart from "./pages/Charts/LineChart";
import BarChart from "./pages/Charts/BarChart";
import Calendar from "./pages/Calendar";
import BasicTables from "./pages/Tables/BasicTables";
import FormElements from "./pages/Forms/FormElements";
import Blank from "./pages/Blank";
import Dashboard from "./pages/Dashboard";
import Demo from "./pages/Demo";
import Collections from "./pages/Collections";
import Products from "./pages/Products";
import ProductEditor from "./pages/ProductEditor";
import Inventory from "./pages/Inventory";
import Coupons from "./pages/Coupons";
import Customers from "./pages/B2C/Customers";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Financials from "./pages/Financials";
import Cases from "./pages/Cases";
import Employees from "./pages/Employees";
import Settings from "./pages/Settings";

export default function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster position="bottom-right" richColors closeButton/>
                <ScrollToTop/>
                <Routes>
                    {/* -------------------- */}
                    {/* 🔑 Public Routes */}
                    {/* -------------------- */}
                    <Route path="/signin" element={<PublicRoute><SignIn/></PublicRoute>}/>
                    <Route path="/unauthorized" element={<Unauthorized/>}/>

                    {/* -------------------- */}
                    {/* 🔒 Protected Routes */}
                    {/* -------------------- */}
                    <Route
                        element={
                            <ProtectedRoute allowedRoles={["admin", "staff"]}>
                                <AppLayout/>
                            </ProtectedRoute>
                        }
                    >
                        {/* Shared Admin & Staff Routes */}
                        <Route index element={<Dashboard/>}/>
                        <Route path="/demo" element={<Demo/>}/>
                        <Route path="/countries" element={<Collections/>}/>
                        <Route path="/products" element={<Products/>}/>
                        <Route path="/products/new" element={<ProductEditor/>}/>
                        <Route path="/products/:id" element={<ProductEditor/>}/>
                        <Route path="/products/:id/edit" element={<ProductEditor/>}/>
                        <Route path="/inventory" element={<Inventory/>}/>
                        <Route path="/coupons" element={<Coupons/>}/>
                        <Route path="b2c/customers" element={<Customers/>}/>
                        <Route path="b2b/customers" element={<Customers/>}/>
                        <Route path="b2e/customers" element={<Customers/>}/>
                        <Route path="/orders" element={<Orders/>}/>
                        <Route path="/analytics" element={<Analytics/>}/>
                        <Route path="/financials" element={<Financials/>}/>
                        <Route path="/cases" element={<Cases/>}/>
                        <Route path="/settings" element={<Settings/>}/>

                        {/* 🔐 Admin-only Route */}
                        <Route
                            element={<ProtectedRoute allowedRoles={["admin"]}/>}
                        >
                            <Route path="/employees" element={<Employees/>}/>
                        </Route>

                        {/* Misc & UI pages */}
                        <Route path="/profile" element={<UserProfiles/>}/>
                        <Route path="/calendar" element={<Calendar/>}/>
                        <Route path="/blank" element={<Blank/>}/>
                        <Route path="/form-elements" element={<FormElements/>}/>
                        <Route path="/basic-tables" element={<BasicTables/>}/>
                        <Route path="/alerts" element={<Alerts/>}/>
                        <Route path="/avatars" element={<Avatars/>}/>
                        <Route path="/badge" element={<Badges/>}/>
                        <Route path="/buttons" element={<Buttons/>}/>
                        <Route path="/images" element={<Images/>}/>
                        <Route path="/videos" element={<Videos/>}/>
                        <Route path="/line-chart" element={<LineChart/>}/>
                        <Route path="/bar-chart" element={<BarChart/>}/>
                    </Route>

                    {/* 🧭 Fallback */}
                    <Route path="*" element={<NotFound/>}/>
                </Routes>
            </Router>
        </AuthProvider>
    );
}

/* -------------------- */
/* 🚧 PublicRoute Helper */
/* Redirects logged-in users away from /signin */

/* -------------------- */
function PublicRoute({children}: { children: JSX.Element }) {
    const {isAuthenticated, isLoading} = useAuth();

    if (isLoading) return <Loader/>;

    return isAuthenticated ? <Navigate to="/" replace/> : children;
}
