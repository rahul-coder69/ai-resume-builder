import {
  CircleCheckBig,
  CircleX,
  FilePenIcon,
  LoaderCircleIcon,
  PencilIcon,
  PlusIcon,
  RefreshCcw,
  TrashIcon,
  UploadCloud,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { dummyResumeData } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { logout } from "../app/features/authSlice";
import { deleteUserAccount } from "../configs/api";

const getPdfToTextParser = async () => {
  const module = await import("react-pdftotext");
  return module?.default?.default ?? module?.default ?? module;
};

const Dashboard = () => {
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const colors = ["#9333ea", "#d97706", "#dc2626", "#0284c7", "#16a34a"];

  const [allResumes, setAllResumes] = useState([]);
  const [showCreateResume, setShowCreateResume] = useState(false);
  const [showUploadResume, setShowUploadResume] = useState(false);
  const [title, setTitle] = useState("");
  const [resume, setResume] = useState(null);
  const [editResumeId, setEditResumeId] = useState("");
  const [isloading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [emailHealthLoading, setEmailHealthLoading] = useState(false);
  const [emailHealth, setEmailHealth] = useState({
    ok: false,
    loaded: false,
    deliveryMode: "unknown",
    smtpConfigured: false,
    rabbitConfigured: false,
    rabbitConnected: false,
  });

  const navigate = useNavigate();
  const isDeleteConfirmationValid = deleteConfirmText === "delete";

  const deleteUserAccountHandler = async () => {
    if (isDeletingAccount) return;

    try {
      setIsDeletingAccount(true);
      await deleteUserAccount();
      toast.success("Account deleted sucessfully");

      dispatch(logout());
      navigate("/");
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const loadAllResumes = async () => {
    if (!token) return;

    try {
      const { data } = await api.get("/api/users/resumes");
      setAllResumes(data.resumes);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const loadEmailHealth = async () => {
    try {
      setEmailHealthLoading(true);
      const { data } = await api.get("/api/test/email-status");

      setEmailHealth({
        ok: Boolean(data?.ok),
        loaded: true,
        deliveryMode: data?.deliveryMode || "unknown",
        smtpConfigured: Boolean(data?.emailProvider?.configured),
        rabbitConfigured: Boolean(data?.rabbitMq?.configured),
        rabbitConnected: Boolean(data?.rabbitMq?.connected),
      });
    } catch (error) {
      setEmailHealth((prev) => ({
        ...prev,
        ok: false,
        loaded: true,
      }));
    } finally {
      setEmailHealthLoading(false);
    }
  };

  const createResume = async (event) => {
    try {
      event.preventDefault();

      const { data } = await api.post("/api/resumes/create", { title });

      setAllResumes([...allResumes, data.resume]);
      setTitle("");
      setShowCreateResume(false);
      navigate(`/app/builder/${data.resume._id}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  const uploadResume = async (event) => {
    event.preventDefault();

    if (!token) {
      toast.error("Please login first");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter resume title");
      return;
    }

    if (!resume) {
      toast.error("Please upload a PDF file first");
      return;
    }

    setIsLoading(true);
    try {
      const pdfToText = await getPdfToTextParser();
      if (typeof pdfToText !== "function") {
        throw new Error("PDF parser is not available");
      }

      const resumeText = await pdfToText(resume);
      const { data } = await api.post("/api/ai/upload-resume", {
        title,
        resumeText,
      });
      setTitle("");
      setResume(null);
      setShowUploadResume(false);
      navigate(`/app/builder/${data.resumeId}`);
    } catch (error) {
      if (error.message === "PDF parser is not available") {
        toast.error("Unable to read PDF. Please refresh and try again.");
      } else {
        toast.error(error?.response?.data?.message || error.message);
      }
    }
    setIsLoading(false);
  };

  const editTitle = async (event) => {
    try {
      event.preventDefault();
      const { data } = await api.put(`/api/resumes/update`, {
        resumeId: editResumeId,
        resumeData: { title },
      });
      setAllResumes(
        allResumes.map((resume) =>
          resume._id === editResumeId ? { ...resume, title } : resume,
        ),
      );
      setTitle("");
      setEditResumeId("");
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };
  const deleteResume = async (resumeId) => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to delete this resume?",
      );
      if (confirm) {
        const { data } = await api.delete(`/api/resumes/delete/${resumeId}`);
        setAllResumes(allResumes.filter((resume) => resume._id !== resumeId));
        toast.success(data.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    loadAllResumes();
  }, [token]);

  useEffect(() => {
    if (token) {
      loadEmailHealth();
    }
  }, [token]);

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-2xl font-medium mb-6 bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent sm:hidden">
          Welcome, Nirmal Barman
        </p>
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setShowDeleteConfirm(true);
            }}
            className="bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 px-4 py-2 rounded-full text-sm font-medium active:scale-95 transition-all inline-flex items-center gap-2"
          >
            <TrashIcon className="size-4" />
            Delete Account
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Email System Health</p>
              <p className="text-lg font-semibold text-slate-800">
                {emailHealth.loaded
                  ? emailHealth.ok && emailHealth.smtpConfigured
                    ? "Ready"
                    : "Needs Setup"
                  : "Checking..."}
              </p>
            </div>

            <button
              onClick={loadEmailHealth}
              disabled={emailHealthLoading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCcw
                className={`size-4 ${emailHealthLoading ? "animate-spin" : ""}`}
              />
              Check Now
            </button>
          </div>

          <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              {emailHealth.smtpConfigured ? (
                <CircleCheckBig className="size-4 text-emerald-600" />
              ) : (
                <CircleX className="size-4 text-red-500" />
              )}
              SMTP: {emailHealth.smtpConfigured ? "OK" : "Missing"}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              {emailHealth.rabbitConfigured ? (
                <CircleCheckBig className="size-4 text-emerald-600" />
              ) : (
                <CircleX className="size-4 text-amber-500" />
              )}
              Queue Config: {emailHealth.rabbitConfigured ? "Yes" : "No"}
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
              {emailHealth.deliveryMode === "queue-worker" ? (
                <CircleCheckBig className="size-4 text-indigo-600" />
              ) : (
                <CircleCheckBig className="size-4 text-emerald-600" />
              )}
              Mode:{" "}
              {emailHealth.deliveryMode === "queue-worker"
                ? "Queue"
                : "Direct SMTP"}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setShowCreateResume(true)}
            className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-indigo-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <PlusIcon className="size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-indigo-300 to-indigo-500 text-white rounded-full" />
            <p className="text-sm group-hover:text-indigo-600 transition-all duration-300">
              Create Resume
            </p>
          </button>
          <button
            onClick={() => setShowUploadResume(true)}
            className="w-full bg-white sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 text-slate-600 border border-dashed border-slate-300 group hover:border-purple-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            <UploadCloudIcon className="size-11 transition-all duration-300 p-2.5 bg-gradient-to-br from-purple-300 to-purple-500 text-white rounded-full" />
            <p className="text-sm group-hover:text-purple-600 transition-all duration-300">
              Upload Existing
            </p>
          </button>
        </div>

        <hr className="border-slate-300 my-6 sm:w-[305px]" />

        <div className="grid grid-cols-2 sm:flex flex-wrap gap-4">
          {allResumes.map((resume, index) => {
            const baseColor = colors[index % colors.length];
            return (
              <button
                key={resume._id}
                onClick={() => navigate(`/app/builder/${resume._id}`)}
                className="relative w-full sm:max-w-36 h-48 flex flex-col items-center justify-center rounded-lg gap-2 border group hover:shadow-lg transition-all duration-300 cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${baseColor}10, ${baseColor}40)`,
                  borderColor: baseColor + "40",
                }}
              >
                <FilePenIcon
                  className="size-7 group-hover:scale-105 transition-all"
                  style={{ color: baseColor }}
                />
                <p
                  className="text-sm group-hover:scale-105 transition-all px-2 text-center"
                  style={{ color: baseColor }}
                >
                  {resume.title}
                </p>
                <p
                  className="absolute bottom-1 text-[11px] text-slate-400 group-hover:text-slate-500 transition-all duration-300 px-2 text-center"
                  style={{ color: baseColor + "90" }}
                >
                  Updated on {new Date(resume.updatedAt).toLocaleDateString()}
                </p>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-1 right-1 group-hover:flex items-center hidden"
                >
                  <TrashIcon
                    onClick={() => deleteResume(resume._id)}
                    className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors"
                  />
                  <PencilIcon
                    onClick={() => {
                      setEditResumeId(resume._id);
                      setTitle(resume.title);
                    }}
                    className="size-7 p-1.5 hover:bg-white/50 rounded text-slate-700 transition-colors"
                  />
                </div>
              </button>
            );
          })}
        </div>

        {showCreateResume && (
          <form
            onSubmit={createResume}
            onClick={() => setShowCreateResume(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Create a Resume</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter Resume Title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />

              <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Create Resume
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  (setShowCreateResume(false), setTitle(""));
                }}
              />
            </div>
          </form>
        )}

        {showUploadResume && (
          <form
            onSubmit={uploadResume}
            onClick={() => setShowUploadResume(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Upload Resume</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter Resume Title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />

              <div>
                <label
                  htmlFor="resume-input"
                  className="block text-sm text-slate-700"
                >
                  Select Resume File
                  <div className="flex flex-col items-center gap-2 border group text-slate-400 border-slate-400 border-dashed rounded-md p-4 py-10 my-4 hover:border-green-500 hover:text-green-700 cursor-pointer transition-colors">
                    {resume ? (
                      <p className="text-green-700">{resume.name}</p>
                    ) : (
                      <>
                        <UploadCloud className="size-14 stroke-1" />
                        <p>Upload Resume</p>
                      </>
                    )}
                  </div>
                </label>
                <input
                  type="file"
                  id="resume-input"
                  accept=".pdf"
                  hidden
                  onChange={(e) => setResume(e.target.files[0])}
                />
              </div>

              <button
                disabled={isloading}
                className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
              >
                {isloading && (
                  <LoaderCircleIcon className="animate-spin size-4 text-white" />
                )}
                {isloading ? "Uploading..." : "Upload Resume"}
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  (setShowUploadResume(false), setTitle(""));
                }}
              />
            </div>
          </form>
        )}

        {editResumeId && (
          <form
            onSubmit={editTitle}
            onClick={() => setEditResumeId("")}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-4">Edit Resume Title</h2>
              <input
                onChange={(e) => setTitle(e.target.value)}
                value={title}
                type="text"
                placeholder="Enter Resume Title"
                className="w-full px-4 py-2 mb-4 focus:border-green-600 ring-green-600"
                required
              />

              <button className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                Update
              </button>
              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  setEditResumeId("");
                  setTitle("");
                }}
              />
            </div>
          </form>
        )}

        {showDeleteConfirm && (
          <div
            onClick={() => !isDeletingAccount && setShowDeleteConfirm(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur bg-opacity-50 z-10 flex items-center justify-center"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative bg-slate-50 border border-red-200 shadow-md rounded-lg w-full max-w-sm p-6"
            >
              <h2 className="text-xl font-bold mb-2 text-red-700 select-none">
                Delete Account
              </h2>
              <p className="text-slate-600 mb-6 select-none">
                This action cannot be undone. This will permanently delete your
                account and all your resumes from our database.
              </p>

              <label className="block mb-4">
                <span className="text-sm text-slate-600 select-none">
                  Type delete to confirm
                </span>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="delete"
                  disabled={isDeletingAccount}
                  className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-200"
                />
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }}
                  className="flex-1 py-2 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeletingAccount || !isDeleteConfirmationValid}
                  onClick={deleteUserAccountHandler}
                  className="flex-1 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount && (
                    <LoaderCircleIcon className="animate-spin size-4" />
                  )}
                  {isDeletingAccount ? "Deleting..." : "Delete Account"}
                </button>
              </div>

              <XIcon
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
                onClick={() => {
                  if (!isDeletingAccount) {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText("");
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
