import fs from "fs";

// Controller for creating a new resume
// POST: /api/resumes/create

import Resume from "../models/Resume.js";
import imageKit from "../configs/imageKit.js";

export const createResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { title } = req.body;

    // Create a new resume
    const newResume = await Resume.create({
      userId,
      title,
    });

    // Return success message
    return res.status(201).json({
      message: "Resume created successfully",
      resume: newResume,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for deleting a resume
// DELETE: /api/resumes/delete

export const deleteResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    await Resume.findOneAndDelete({ userId, _id: resumeId });

    // Return success message
    return res.status(200).json({
      message: "Resume deleted successfully",
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Get user resume by ID
// GET: /api/resumes/get

export const getResumeById = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ userId, _id: resumeId });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }

    resume.__v = undefined;
    resume.createdAt = undefined;
    resume.updatedAt = undefined;

    return res.status(200).json({
      resume,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Get resume by ID public
// GET: /api/resumes/public

export const getPublicResumeById = async (req, res) => {
  try {
    const { resumeId } = req.params;

    const resume = await Resume.findOne({ public: true, _id: resumeId });

    if (!resume) {
      return res.status(404).json({
        message: "Resume not found",
      });
    }
    return res.status(200).json({
      resume,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for updating a resume
// PUT: /api/resumes/update

export const updateResume = async (req, res) => {
  try {
    const userId = req.userId;
    const { resumeId, resumeData, removeBackground } = req.body;
    const image = req.file;
    const shouldRemoveBackground =
      removeBackground === true ||
      removeBackground === "true" ||
      removeBackground === "1" ||
      removeBackground === "yes";

    let resumeDataCopy;
    if (typeof resumeData === "string") {
      resumeDataCopy = await JSON.parse(resumeData);
    } else {
      resumeDataCopy = structuredClone(resumeData);
    }

    const cropTransformations = [
      "w-512",
      "h-512",
      "c-maintain_ratio",
      "fo-auto",
      "z-1",
      "q-90",
    ];

    const preTransformation = shouldRemoveBackground
      ? `e-removedotbg:${[...cropTransformations, "f-png"].join(",")}`
      : cropTransformations.join(",");

    const uploadProcessedImage = async (fileSource) => {
      const response = await imageKit.files.upload({
        file: fileSource,
        fileName: shouldRemoveBackground ? "resume.png" : "resume.jpg",
        folder: "user-resumes",
        transformation: {
          pre: preTransformation,
        },
      });

      if (!resumeDataCopy.personal_info) {
        resumeDataCopy.personal_info = {};
      }

      resumeDataCopy.personal_info.image = response.url;
    };

    if (image) {
      const imageBufferData = fs.createReadStream(image.path);
      await uploadProcessedImage(imageBufferData);
    } else if (
      shouldRemoveBackground &&
      typeof resumeDataCopy.personal_info?.image === "string" &&
      resumeDataCopy.personal_info.image
    ) {
      await uploadProcessedImage(resumeDataCopy.personal_info.image);
    }
    const resume = await Resume.findOneAndUpdate(
      { userId, _id: resumeId },
      resumeDataCopy,
      {
        new: true,
      },
    );

    return res.status(200).json({
      message: "Saved successfully",
      resume,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
