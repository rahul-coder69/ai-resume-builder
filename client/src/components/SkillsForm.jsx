import { Plus, Sparkles, X } from "lucide-react";
import { useState } from "react";

const SkillsForm = ({ data = [], onChange }) => {
  const [newSkill, setNewSkill] = useState("");
  const skills = Array.isArray(data) ? data : [];

  const addSkill = () => {
    const normalizedSkill = newSkill.trim();
    if (normalizedSkill && !skills.includes(normalizedSkill)) {
      onChange([...skills, normalizedSkill]);
      setNewSkill("");
    }
  };

  const removeSkill = (indexToRemove) => {
    onChange(skills.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSkill();
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
          Skills
        </h3>
        <p className="text-sm text-gray-500">
          Add Your Technical and Soft Skills
        </p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Enter a Skill (e.g., JavaScript, Project Management)"
          className="flex-1 px-3 py-2 text-sm"
          onChange={(e) => setNewSkill(e.target.value)}
          value={newSkill}
          onKeyDown={handleKeyPress}
        />
        <button
          onClick={addSkill}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed "
        >
          <Plus className="size-4" /> Add
        </button>
      </div>
      {skills.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span
              key={index}
              className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
              <button
                onClick={() => removeSkill(index)}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <Sparkles className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p>No skills added yet.</p>
          <p className="text-sm">Add your technical and soft skills above.</p>
        </div>
      )}

      <div className="bg-blue-50 p-3 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Add 8-12 relative skills. Include both technical
          skills (Programming languages, tools) and soft skills (Leadership,
          Communication).
        </p>
      </div>
    </div>
  );
};

export default SkillsForm;
