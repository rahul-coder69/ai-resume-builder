import { dummyResumeData } from "../assets/assets";

const STORAGE_KEY = "resume_builder_resumes";

export const getStoredResumes = () => {
  try {
    const rawResumes = localStorage.getItem(STORAGE_KEY);
    if (!rawResumes) {
      return dummyResumeData;
    }

    const parsedResumes = JSON.parse(rawResumes);
    return Array.isArray(parsedResumes) ? parsedResumes : dummyResumeData;
  } catch {
    return dummyResumeData;
  }
};

export const saveResumes = (resumes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(resumes));
};
