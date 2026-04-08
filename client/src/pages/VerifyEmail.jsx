import React from "react";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../configs/api";
import { useDispatch } from "react-redux";
import { login } from "../app/features/authSlice";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [verified, setVerified] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!token) {
      setError("Invalid verification link");
      setLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        setLoading(true);

        const { data } = await api.post("/api/users/verify-email", {
          token,
        });

        if (data.token) {
          dispatch(login(data));
        }

        toast.success(data.message);
        setVerified(true);

        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate("/app");
        }, 2000);
      } catch (err) {
        setError(err.response?.data?.message || err.message);
        toast.error(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token, dispatch, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="sm:w-[380px] w-full text-center border border-gray-300/60 rounded-2xl px-8 py-12 bg-white">
        {loading ? (
          <>
            <div className="flex justify-center mb-4">
              <div className="animate-spin">
                <Mail size={48} className="text-green-500" />
              </div>
            </div>
            <h1 className="text-gray-900 text-2xl font-medium">
              Verifying your email...
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Please wait while we verify your email address
            </p>
          </>
        ) : verified ? (
          <>
            <div className="flex justify-center mb-4">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h1 className="text-gray-900 text-2xl font-medium">
              Email Verified!
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Your email has been verified successfully. Redirecting to your
              dashboard...
            </p>
            <button
              onClick={() => navigate("/app")}
              className="mt-6 w-full h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity font-medium"
            >
              Go to Dashboard
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h1 className="text-gray-900 text-2xl font-medium">
              Verification Failed
            </h1>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 h-11 rounded-full text-white bg-green-500 hover:opacity-90 transition-opacity font-medium"
              >
                Back to Login
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 h-11 rounded-full text-green-600 border border-green-500 hover:bg-green-50 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
