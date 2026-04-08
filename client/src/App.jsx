import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import ResumeBuilder from "./pages/ResumeBuilder";
import Preview from "./pages/Preview";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import VerifyEmail from "./pages/VerifyEmail";
import VerifyEmailPending from "./pages/VerifyEmailPending";
import ForgotPassword from "./pages/ForgotPassword";
import { useDispatch } from "react-redux";
import api from "./configs/api";
import { login, logout, setLoading } from "./app/features/authSlice";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const dispatch = useDispatch();

  const getUserData = async () => {
    const token = localStorage.getItem("token");
    const cachedUser = localStorage.getItem("authUser");

    if (!token) {
      dispatch(setLoading(false));
      return;
    }

    if (cachedUser) {
      try {
        const parsedUser = JSON.parse(cachedUser);
        if (parsedUser) {
          dispatch(login({ token, user: parsedUser }));
        }
      } catch {
        localStorage.removeItem("authUser");
      }
    }

    try {
      const { data } = await api.get("/api/users/data", {
        headers: {
          Authorization: token,
        },
      });

      if (data.user) {
        dispatch(login({ token, user: data.user }));
      }
    } catch (error) {
      if (!cachedUser) {
        dispatch(logout());
      }
      console.log(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-email-pending" element={<VerifyEmailPending />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="app" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="builder/:resumeId" element={<ResumeBuilder />} />
        </Route>
        <Route path="view/:resumeId" element={<Preview />} />
      </Routes>
    </>
  );
};

export default App;
