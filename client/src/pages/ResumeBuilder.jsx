import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  EyeIcon,
  EyeOffIcon,
  FileText,
  FolderIcon,
  GraduationCap,
  Share2Icon,
  Sparkles,
  User,
} from "lucide-react";
import PersonalInfoForm from "../components/PersonalInfoForm";
import { getStoredResumes, saveResumes } from "../utils/resumeStorage";
import ResumePreview from "../components/ResumePreview";
import TemplateSelector from "../components/TemplateSelector";
import ColorPicker from "../components/ColorPicker";
import ProfessionalSummaryForm from "../components/ProfessionalSummaryForm";
import ExperienceForm from "../components/ExperienceForm";
import EducationForm from "../components/EducationForm";
import ProjectForm from "../components/ProjectForm";
import SkillsForm from "../components/SkillsForm";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";

const defaultResumeData = {
  _id: "",
  title: "",
  personal_info: {},
  professional_summary: "",
  experience: [],
  education: [],
  skills: [],
  projects: [],
  template: "classic",
  accent_color: "#3b82f6",
  public: false,
};

const isFile = (value) => typeof File !== "undefined" && value instanceof File;

const normalizeResumeData = (resume) => {
  if (!resume) {
    return defaultResumeData;
  }

  const normalizedProjects = Array.isArray(resume.projects)
    ? resume.projects
    : Array.isArray(resume.project)
      ? resume.project
      : [];

  return {
    ...defaultResumeData,
    ...resume,
    personal_info: resume.personal_info || {},
    experience: Array.isArray(resume.experience) ? resume.experience : [],
    education: Array.isArray(resume.education) ? resume.education : [],
    skills: Array.isArray(resume.skills) ? resume.skills : [],
    projects: normalizedProjects,
  };
};

const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const { token } = useSelector((state) => state.auth);
  const [resumeData, setResumeData] = useState(defaultResumeData);

  const loadExistingResume = async () => {
    if (!token || !resumeId) {
      return;
    }

    try {
      const { data } = await api.get(`/api/resumes/get/${resumeId}`, {
        headers: { Authorization: token },
      });

      if (data.resume) {
        setResumeData(normalizeResumeData(data.resume));
        document.title = data.resume.title;
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);

  const [isRemovingBackground, setIsRemovingBackground] = useState(false);
  const [isRemovingImage, setIsRemovingImage] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);

  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
  ];

  const activeSection = sections[activeSectionIndex];

  useEffect(() => {
    loadExistingResume();
  }, [resumeId, token]);

  useEffect(() => {
    if (!resumeData._id) {
      return;
    }

    const resumes = getStoredResumes();
    const updatedResumes = resumes.map((resume) =>
      resume._id === resumeData._id
        ? { ...resumeData, updatedAt: new Date().toISOString() }
        : resume,
    );

    saveResumes(updatedResumes);
  }, [resumeData]);

  const getCurrentResumeId = () => resumeData?._id || resumeId;

  const changeResumeVisibility = async () => {
    const currentResumeId = getCurrentResumeId();

    if (!token) {
      toast.error("Please login first");
      return;
    }

    if (!currentResumeId || isUpdatingVisibility) {
      if (!currentResumeId) {
        toast.error("Resume not found");
      }
      return;
    }

    setIsUpdatingVisibility(true);
    try {
      const formData = new FormData();
      formData.append("resumeId", currentResumeId);
      formData.append(
        "resumeData",
        JSON.stringify({ public: !resumeData.public }),
      );

      const { data } = await api.put("/api/resumes/update", formData, {
        headers: { Authorization: token },
      });
      setResumeData((prev) =>
        data?.resume
          ? normalizeResumeData(data.resume)
          : { ...prev, public: !prev.public },
      );
      toast.success(data.message);
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      console.error("Error updating visibility:", error);
    } finally {
      setIsUpdatingVisibility(false);
    }
  };

  const handleShare = async () => {
    const currentResumeId = getCurrentResumeId();

    if (!currentResumeId) {
      toast.error("Resume not found");
      return;
    }

    const resumeUrl = `${window.location.origin}/view/${currentResumeId}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: resumeData.title || "My Resume",
          text: "View my resume",
          url: resumeUrl,
        });
        return;
      } catch {
        // fallback below
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(resumeUrl);
        toast.success("Share link copied");
        return;
      }
    } catch {
      // fallback below
    }

    window.open(resumeUrl, "_blank", "noopener,noreferrer");
  };

  const downloadResume = async () => {
    const currentResumeId = getCurrentResumeId();

    if (!currentResumeId) {
      toast.error("Resume not found");
      return;
    }

    if (!token) {
      toast.error("Please login first");
      return;
    }

    const saved = await saveResume({ successMessage: "Resume saved" });
    if (!saved) {
      return;
    }

    const previousTitle = document.title;
    document.title = (resumeData.title || "resume").trim() || "resume";

    try {
      window.print();
    } finally {
      document.title = previousTitle;
    }
  };

  const saveResume = async ({
    removeBackground = false,
    successMessage,
    resumePayload,
  } = {}) => {
    try {
      const sourceResumeData = resumePayload || resumeData;
      const currentResumeId = getCurrentResumeId();

      if (!currentResumeId) {
        toast.error("Resume not found");
        return null;
      }

      let updatedResumeData = structuredClone(sourceResumeData);

      // Remove image from updatedResumeData
      if (isFile(sourceResumeData.personal_info.image)) {
        delete updatedResumeData.personal_info.image;
      }
      const formData = new FormData();
      formData.append("resumeId", currentResumeId);
      formData.append("resumeData", JSON.stringify(updatedResumeData));

      removeBackground && formData.append("removeBackground", "yes");
      isFile(sourceResumeData.personal_info.image) &&
        formData.append("image", sourceResumeData.personal_info.image);

      const { data } = await api.put("/api/resumes/update", formData, {
        headers: { Authorization: token },
      });

      setResumeData(normalizeResumeData(data.resume));
      toast.success(successMessage || data.message);

      return data;
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message);
      console.error("Error saving resume:", error);
      return null;
    }
  };

  const handleRemoveBackground = async () => {
    if (
      !resumeData.personal_info?.image ||
      isRemovingBackground ||
      isUploadingImage
    ) {
      return;
    }

    setIsRemovingBackground(true);
    await saveResume({
      removeBackground: true,
      successMessage: "Background removed",
    });
    setIsRemovingBackground(false);
  };

  const handleRemoveImage = async () => {
    if (
      !resumeData.personal_info?.image ||
      isRemovingImage ||
      isUploadingImage
    ) {
      return;
    }

    const previousResumeData = resumeData;
    const nextResumeData = {
      ...resumeData,
      personal_info: {
        ...resumeData.personal_info,
        image: "",
      },
    };

    setIsRemovingImage(true);
    setResumeData(nextResumeData);

    const result = await saveResume({
      resumePayload: nextResumeData,
      successMessage: "Image removed",
    });

    if (!result) {
      setResumeData(previousResumeData);
    }

    setIsRemovingImage(false);
  };

  const handleUploadImage = async (file) => {
    if (!file || isUploadingImage || isRemovingImage || isRemovingBackground) {
      return;
    }

    const previousResumeData = resumeData;
    const nextResumeData = {
      ...resumeData,
      personal_info: {
        ...resumeData.personal_info,
        image: file,
      },
    };

    setIsUploadingImage(true);
    setResumeData(nextResumeData);

    const result = await saveResume({
      resumePayload: nextResumeData,
      successMessage: "Image uploaded",
    });

    if (!result) {
      setResumeData(previousResumeData);
    }

    setIsUploadingImage(false);
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link
          to={"/app"}
          className="inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all"
        >
          <ArrowLeftIcon className="size-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Form */}
          <div className="relative lg:col-span-5 rounded-lg overflow-hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pt-1">
              {/* Progress Bar using activeSectionIndex */}
              <hr className="absolute top-0 left-0 right-0 border-2 border-gray-200" />
              <hr
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-green-500 to-green-600 border-none transition-all duration-2000"
                style={{
                  width: `${(activeSectionIndex * 100) / (sections.length - 1)}%`,
                }}
              />

              {/* Section Navigation */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-300 py-1">
                <div className="flex items-center gap-2">
                  <TemplateSelector
                    selectedTemplate={resumeData.template}
                    accentColor={resumeData.accent_color}
                    onChange={(template) =>
                      setResumeData((prev) => ({ ...prev, template }))
                    }
                  />
                  <ColorPicker
                    selectedColor={resumeData.accent_color}
                    onChange={(color) =>
                      setResumeData((prev) => ({
                        ...prev,
                        accent_color: color,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center">
                  {activeSectionIndex !== 0 && (
                    <button
                      onClick={() =>
                        setActiveSectionIndex((prevIndex) =>
                          Math.max(prevIndex - 1, 0),
                        )
                      }
                      className="flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                      disabled={activeSectionIndex === 0}
                    >
                      <ChevronLeft className="size-4" />
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setActiveSectionIndex((prevIndex) =>
                        Math.min(prevIndex + 1, sections.length - 1),
                      )
                    }
                    className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all ${activeSectionIndex === sections.length - 1 && "opacity-50"}`}
                    disabled={activeSectionIndex === sections.length - 1}
                  >
                    <ChevronRight className="size-4" />
                    Next
                  </button>
                </div>
              </div>

              {/* Form Content */}

              <div className="space-y-6">
                {activeSection.id === "personal" && (
                  <PersonalInfoForm
                    data={resumeData.personal_info}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personal_info: data,
                      }))
                    }
                    onRemoveBackground={handleRemoveBackground}
                    isRemovingBackground={isRemovingBackground}
                    onRemoveImage={handleRemoveImage}
                    isRemovingImage={isRemovingImage}
                    onUploadImage={handleUploadImage}
                    isUploadingImage={isUploadingImage}
                  />
                )}
                {activeSection.id === "summary" && (
                  <ProfessionalSummaryForm
                    data={resumeData.professional_summary}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        professional_summary: data,
                      }))
                    }
                    setResumeData={setResumeData}
                  />
                )}
                {activeSection.id === "experience" && (
                  <ExperienceForm
                    data={resumeData.experience}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        experience: data,
                      }))
                    }
                  />
                )}

                {activeSection.id === "education" && (
                  <EducationForm
                    data={resumeData.education}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        education: data,
                      }))
                    }
                  />
                )}

                {activeSection.id === "projects" && (
                  <ProjectForm
                    data={resumeData.projects}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        projects: data,
                        project: data,
                      }))
                    }
                  />
                )}

                {activeSection.id === "skills" && (
                  <SkillsForm
                    data={resumeData.skills}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        skills: data,
                      }))
                    }
                  />
                )}
              </div>
              <button
                onClick={() => {
                  saveResume();
                }}
                className="bg-gradient-to-br from-green-100 to-green-200 ring-green-300 text-green-600 ring hover:ring-green-400 transition-all rounded-md px-6 py-2 mt-6 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
          {/* Right Panel - Preview */}
          <div className="lg:col-span-7 max-lg:mt-6">
            <div className="relative w-full">
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-end gap-2">
                {resumeData.public && (
                  <button
                    onClick={handleShare}
                    className="flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg ring-blue-300 hover:ring transition-colors"
                  >
                    <Share2Icon className="size-4" /> Share
                  </button>
                )}
                <button
                  onClick={changeResumeVisibility}
                  className="flex items-center p-2 px-4 gap-2 text-xs bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg hover:ring transition-colors"
                >
                  {resumeData.public ? (
                    <EyeIcon className="size-4" />
                  ) : (
                    <EyeOffIcon className="size-4" />
                  )}
                  {resumeData.public ? "Public" : "Private"}
                </button>
                <button
                  onClick={downloadResume}
                  className="flex items-center gap-2 px-6 py-2 text-xs bg-gradient-to-br from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors"
                >
                  <DownloadIcon className="size-4" /> Download
                </button>
              </div>
            </div>

            {/* -- Resume Preview --- */}
            <ResumePreview
              data={resumeData}
              template={resumeData.template}
              accentColor={resumeData.accent_color}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
