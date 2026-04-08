import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

const normalizeArray = (value) => (Array.isArray(value) ? value : []);

const normalizeObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const buildFallbackResumeData = (resumeText) => {
  const cleanText = (resumeText || "").replace(/\s+/g, " ").trim();
  return {
    professional_summary: cleanText.slice(0, 400),
    skills: [],
    personal_info: {},
    experience: [],
    project: [],
    education: [],
  };
};

const sanitizeResumeData = (parsedData) => {
  const safeData = normalizeObject(parsedData);
  return {
    professional_summary: safeData.professional_summary || "",
    skills: normalizeArray(safeData.skills),
    personal_info: normalizeObject(safeData.personal_info),
    experience: normalizeArray(safeData.experience),
    project: normalizeArray(safeData.project),
    education: normalizeArray(safeData.education),
  };
};

const extractSummarySeedText = (input) => {
  const text = String(input || "").trim();
  const match = text.match(/enhance my professional summary\s*"([\s\S]*)"/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  return text;
};

const buildEnhancedSummaryFallback = (input) => {
  const seed = extractSummarySeedText(input).replace(/\s+/g, " ").trim();

  if (!seed) {
    return "Results-driven professional with strong communication, problem-solving, and collaboration skills. Experienced in delivering high-quality work, adapting quickly to changing priorities, and contributing to team success. Focused on continuous learning and creating measurable business impact.";
  }

  const trimmed = seed.replace(/[.\s]+$/, "");
  return `${trimmed}. Proven ability to take ownership, collaborate across teams, and deliver high-quality outcomes on time. Committed to growth, measurable impact, and building long-term value for organizations.`;
};

// Controller for enhancing a resume's professional summary using AI
// POST: /api/ai/enhance-pro-sum

export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    let enhancedContent = "";

    try {
      const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are an an expert in resume writing. Your task is to enhance the professional summary provided by the user or resume. The summary should be 3-5 sentences also highlighting key skills, experience, and career objectives. Make it compelling and ATS-friendly, and only return text no options or anything else.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
      });

      enhancedContent = response.choices?.[0]?.message?.content || "";
    } catch (aiError) {
      enhancedContent = buildEnhancedSummaryFallback(userContent);
      return res.status(200).json({
        enhancedContent,
        warning:
          "AI service is temporarily unavailable. Showing fallback result.",
      });
    }

    if (!enhancedContent) {
      enhancedContent = buildEnhancedSummaryFallback(userContent);
    }

    return res.status(200).json({
      enhancedContent,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for enhancing a resume's job description using AI
// POST: /api/ai/enhance-job-desc

export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const response = await ai.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an an expert in resume writing. Your task is to enhance the job description provided by the user. The job description should be only 3-5 sentences also highlighting key responsibilities and achievements. User action verbs and quantifiable results were possible. Make it ATS-friendly, and only return text no options or anything else.",
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    });

    const enhancedContent = response.choices[0].message.content;
    return res.status(200).json({
      enhancedContent,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};

// Controller for uploading a resume to the database
// POST: /api/ai/upload-resume

export const uploadResume = async (req, res) => {
  try {
    const { resumeText, title } = req.body;
    const userId = req.userId;

    if (!resumeText) {
      return res.status(400).json({
        message: "Missing required fields",
      });
    }

    const systemPrompt =
      "You are an expert AI Agent to extract data from resume.";
    const userPrompt = `Extract data from the following resume: ${resumeText}
    Provide data in the following JSON format with no additional text before or after:
    
{
    professional_summary: {
      type: String,
      default: "",
    },
    skills: [
      {
        type: String,
      },
    ],
    personal_info: {
      image: {
        type: String,
        default: "",
      },
      full_name: {
        type: String,
        default: "",
      },
      profession: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      location: {
        type: String,
        default: "",
      },
      linkedin: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
    },
    experience: [
      {
        company: {
          type: String,
        },
        position: {
          type: String,
        },
        start_date: {
          type: String,
        },
        end_date: {
          type: String,
        },
        description: {
          type: String,
        },
        is_current: {
          type: Boolean,
        },
      },
    ],
    project: [
      {
        name: {
          type: String,
        },
        type: {
          type: String,
        },
        description: {
          type: String,
        },
      },
    ],
    education: [
      {
        institution: {
          type: String,
        },
        degree: {
          type: String,
        },
        field: {
          type: String,
        },
        graduation_date: {
          type: String,
        },
        gpa: {
          type: String,
        },
      },
    ],}

    `;

    let parsedData;

    try {
      const response = await ai.chat.completions.create({
        model: process.env.OPENAI_MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        response_format: {
          type: "json_object",
        },
      });

      const extractedData = response.choices?.[0]?.message?.content || "{}";
      parsedData = sanitizeResumeData(JSON.parse(extractedData));
    } catch (aiError) {
      parsedData = buildFallbackResumeData(resumeText);
    }

    const newResume = await Resume.create({
      userId,
      title,
      ...parsedData,
    });

    res.json({
      resumeId: newResume._id,
    });
  } catch (error) {
    return res.status(400).json({
      message: error.message,
    });
  }
};
