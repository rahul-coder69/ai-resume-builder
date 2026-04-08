import {
  BriefcaseBusiness,
  Globe,
  Mail,
  MapPin,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import { FiLinkedin } from "react-icons/fi";

const PersonalInfoForm = ({
  data,
  onChange,
  onRemoveBackground,
  isRemovingBackground,
  onRemoveImage,
  isRemovingImage,
  onUploadImage,
  isUploadingImage,
}) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (onUploadImage) {
      onUploadImage(file);
      return;
    }

    handleChange("image", file);
  };

  const hasImage = Boolean(data.image);

  const fields = [
    {
      key: "full_name",
      label: "Full Name",
      icon: User,
      type: "text",
      required: true,
    },
    {
      key: "email",
      label: "Email Id",
      icon: Mail,
      type: "email",
      required: true,
    },
    { key: "phone", label: "Phone Number", icon: Phone, type: "tel" },
    { key: "location", label: "Location", icon: MapPin, type: "text" },
    {
      key: "profession",
      label: "Profession",
      icon: BriefcaseBusiness,
      type: "text",
    },
    {
      key: "linkedin",
      label: "LinkedIn Profile",
      icon: FiLinkedin,
      type: "url",
    },
    { key: "website", label: "Personal Website", icon: Globe, type: "url" },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900">
        Personal Information
      </h3>
      <p className="text-sm text-gray-600">
        Get started with the personal information
      </p>
      <div className="flex items-center gap-2">
        <label>
          {data.image ? (
            <img
              src={
                typeof data.image === "string"
                  ? data.image
                  : URL.createObjectURL(data.image)
              }
              alt="user-image"
              className="w-16 h-16 rounded-full object-cover object-center mt-5 ring ring-slate-300 hover:opacity-80"
            />
          ) : (
            <div className="inline-flex items-center gap-2 mt-5 text-slate-600 hover:text-slate-700 cursor-pointer">
              <User className="size-10 p-2.5 border rounded-full" />
              {isUploadingImage ? "Uploading..." : "Upload User Image"}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageChange}
            disabled={isUploadingImage}
          />
        </label>
        {hasImage && (
          <button
            type="button"
            onClick={onRemoveBackground}
            disabled={isRemovingBackground || isUploadingImage}
            className="mt-5 inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <User className="size-4" />
            {isRemovingBackground ? "Removing..." : "Remove Background"}
          </button>
        )}
        {data.image && (
          <button
            type="button"
            onClick={onRemoveImage}
            disabled={isRemovingImage || isUploadingImage}
            className="mt-5 inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Remove image"
          >
            <Trash2 className="size-4" />
            {isRemovingImage ? "Removing..." : "Remove Image"}
          </button>
        )}
      </div>

      {fields.map((field) => {
        const Icon = field.icon;
        return (
          <div key={field.key} className="space-y-1 mt-5">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Icon size={18} />
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              value={data[field.key] || ""}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-sm"
              placeholder={`Enter Your ${field.label.toLowerCase()}`}
              required={field.required}
            />
          </div>
        );
      })}
    </div>
  );
};

export default PersonalInfoForm;
