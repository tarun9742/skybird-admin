import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  CheckCircle,
  Loader2,
} from "lucide-react";

const CourseForm = () => {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cloudinary / Thumbnail upload state
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingMainVideo, setUploadingMainVideo] = useState(false);
  const [uploadingLessonVideo, setUploadingLessonVideo] = useState(false);

  const thumbInputRef = useRef(null);
  const mainVideoInputRef = useRef(null);
  const lessonVideoInputRef = useRef(null);

  const [form, setForm] = useState({
    id: "",
    platform: "",
    title: "",
    price: "",
    duration: "",
    lessons: 0,
    level: "Beginner",
    thumbnail: "",
    description: "",
    videos: [],
  });

  const [newVideo, setNewVideo] = useState({
    title: "",
    duration: "",
    videoId: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const platRes = await API.get("/admin/platforms");
        if (platRes.data.success) {
          setPlatforms(platRes.data.data.filter((p) => p.isActive));
        }

        if (isEdit) {
          const { data } = await API.get(`/courses/${id}`);
          if (data.success) {
            const c = data.data;
            setForm({
              id: c.id,
              platform: c.platform,
              title: c.title,
              price: c.price,
              duration: c.duration || "",
              lessons: c.lessons || 0,
              level: c.level || "Beginner",
              thumbnail: c.thumbnail || "",
              description: c.description || "",
              videoId: c.videoId || "",
              videos: (c.videos || []).map((video) => ({
                id: video.id,
                title: video.title,
                duration: video.duration || "",
                videoId: video.videoId,
              })),
            });
          }
        }
      } catch (err) {
        toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Thumbnail Cloudinary Upload Handler
  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("thumbnail", file);

    setUploadingThumb(true);
    try {
      const { data } = await API.post("/admin/upload/thumbnail", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (data.success && data.url) {
        setForm((prev) => ({ ...prev, thumbnail: data.url }));
        toast.success("Thumbnail uploaded successfully!");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to upload thumbnail");
    } finally {
      setUploadingThumb(false);
      if (thumbInputRef.current) thumbInputRef.current.value = "";
    }
  };

  // Main Course Video File Upload Handler
  const handleMainVideoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setUploadingMainVideo(true);

    try {
      const { data } = await API.post("/admin/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success && data.videoId) {
        toast.success("Video processed successfully");

        // Optional:
        // If your course has a main video field in DB,
        // store ONLY videoId.
        setForm((prev) => ({
          ...prev,
          videoId: data.videoId,
        }));
      } else {
        toast.error(data.message || "Video processing failed");
      }
    } catch (err) {
      console.error("Video upload error:", err);

      toast.error(
        err.response?.data?.message || "Failed to upload/process video",
      );
    } finally {
      setUploadingMainVideo(false);

      if (mainVideoInputRef.current) {
        mainVideoInputRef.current.value = "";
      }
    }
  };

  // Individual Lesson Video Upload Handler
  const handleLessonVideoUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please select a valid video file");
      return;
    }

    const formData = new FormData();
    formData.append("video", file);

    setUploadingLessonVideo(true);

    try {
      const { data } = await API.post("/admin/upload/video", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (data.success && data.videoId) {
        setNewVideo((prev) => ({
          ...prev,
          videoId: data.videoId,
        }));

        toast.success("Lesson video processed successfully");
      } else {
        toast.error(data.message || "Video processing failed");
      }
    } catch (err) {
      console.error("Lesson video upload error:", err);

      toast.error(
        err.response?.data?.message || "Failed to upload lesson video",
      );
    } finally {
      setUploadingLessonVideo(false);

      if (lessonVideoInputRef.current) {
        lessonVideoInputRef.current.value = "";
      }
    }
  };

  const addVideo = () => {
    if (!newVideo.title) {
      toast.error("Lesson title is required");
      return;
    }

    if (!newVideo.videoId) {
      toast.error("Please upload a lesson video first");
      return;
    }

    const video = {
      id: `vid-${Date.now()}`,
      title: newVideo.title,
      duration: newVideo.duration || "",
      videoId: newVideo.videoId,
    };

    setForm((prev) => ({
      ...prev,
      videos: [...prev.videos, video],
      lessons: prev.videos.length + 1,
    }));

    setNewVideo({
      title: "",
      duration: "",
      videoId: "",
    });
  };

  const removeVideo = (videoId) => {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((v) => v.id !== videoId),
      lessons: prev.videos.length - 1,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.videos.length === 0) {
      toast.error("Please add at least one lesson");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id: form.id,
        platform: form.platform,
        title: form.title,
        price: Number(form.price),
        duration: form.duration,
        level: form.level,
        thumbnail: form.thumbnail,
        description: form.description,

        // Secure video only
        videoId: form.videoId || null,

        videos: form.videos.map((video) => ({
          id: video.id,
          title: video.title,
          duration: video.duration,
          videoId: video.videoId,
        })),

        lessons: form.videos.length,
      };

      if (isEdit) {
        await API.put(`/admin/courses/${id}`, payload);

        toast.success("Course updated");
      } else {
        await API.post("/admin/courses", payload);

        toast.success("Course created");
      }

      navigate("/courses");
    } catch (err) {
      console.error("Course save error:", err);

      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl pb-16">
      <button
        onClick={() => navigate("/courses")}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEdit ? "Edit Course" : "Create New Course"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course ID (slug)
              </label>
              <input
                name="id"
                value={form.id}
                onChange={handleChange}
                disabled={isEdit}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none disabled:bg-gray-100"
                placeholder="amz-fba-mastery"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marketplace Platform
              </label>
              <select
                name="platform"
                value={form.platform}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none capitalize"
              >
                <option value="">Select marketplace platform</option>
                {platforms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Amazon Ads & ROAS Optimization Masterclass"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price (₹)
              </label>
              <input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Duration
              </label>
              <input
                name="duration"
                value={form.duration}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="4h 30m"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level
              </label>
              <select
                name="level"
                value={form.level}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
              >
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </div>
          </div>

          {/* Thumbnail with Cloudinary Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course Thumbnail (Cloudinary / Image File or URL)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  name="thumbnail"
                  value={form.thumbnail}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="https://res.cloudinary.com/... or upload below"
                />
                <input
                  type="file"
                  ref={thumbInputRef}
                  onChange={handleThumbnailUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploadingThumb}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition disabled:opacity-60"
                >
                  {uploadingThumb ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload to Cloudinary
                    </>
                  )}
                </button>
              </div>

              {form.thumbnail && (
                <div className="relative w-48 h-28 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <img
                    src={form.thumbnail}
                    alt="Thumbnail Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                    Preview
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Main Video URL with Local / Secure Video Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Main Course Video (Secure /videos upload or URL)
            </label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  name="videoUrl"
                  value={form.videoUrl}
                  onChange={handleChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                  placeholder="/uploads/videos/... or external video URL"
                />
                <input
                  type="file"
                  ref={mainVideoInputRef}
                  onChange={handleMainVideoUpload}
                  accept="video/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => mainVideoInputRef.current?.click()}
                  disabled={uploadingMainVideo}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition disabled:opacity-60"
                >
                  {uploadingMainVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading Video...
                    </>
                  ) : (
                    <>
                      <VideoIcon className="w-4 h-4" />
                      Upload Video File
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Uploaded videos are saved securely on the server and streamed
                with encryption token checks.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Detailed description of what sellers will learn in this marketplace training..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        {/* Course Lessons / Videos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lessons & Curriculum ({form.videos.length})
            </h2>
            <span className="text-xs text-gray-500">
              Add sequential chapters for this course
            </span>
          </div>

          {/* Existing videos */}
          {form.videos.length > 0 && (
            <div className="space-y-3">
              {form.videos.map((v, idx) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200"
                >
                  <span className="text-xs font-bold text-gray-400 w-6">
                    #{idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {v.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {v.duration || "Video Lesson"}
                    </p>

                    <div className="flex items-center gap-1 mt-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />

                      <span className="text-xs text-green-600 font-medium">
                        Secure HLS Video
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeVideo(v.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add video form */}
          <div className="border border-dashed border-gray-300 rounded-xl p-5 space-y-4 bg-gray-50/50">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Add New Lesson
              </p>

              <p className="text-xs text-gray-500 mt-1">
                Upload a video. It will be converted to secure encrypted HLS
                before being attached to the course.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lesson title */}
              <input
                value={newVideo.title}
                onChange={(e) =>
                  setNewVideo({
                    ...newVideo,
                    title: e.target.value,
                  })
                }
                placeholder="Lesson Title"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />

              {/* Duration */}
              <input
                value={newVideo.duration}
                onChange={(e) =>
                  setNewVideo({
                    ...newVideo,
                    duration: e.target.value,
                  })
                }
                placeholder="Duration (e.g. 15m 30s)"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>

            {/* Video upload */}
            <div className="flex items-center gap-3">
              <div className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg">
                {newVideo.videoId ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />

                    <span className="text-sm font-medium">
                      Secure HLS video ready
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">
                    No video uploaded
                  </span>
                )}
              </div>

              <input
                type="file"
                ref={lessonVideoInputRef}
                onChange={handleLessonVideoUpload}
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
              />

              <button
                type="button"
                onClick={() => lessonVideoInputRef.current?.click()}
                disabled={uploadingLessonVideo}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-sm font-medium transition disabled:opacity-60"
              >
                {uploadingLessonVideo ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={addVideo}
              disabled={
                !newVideo.title || !newVideo.videoId || uploadingLessonVideo
              }
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              Add Lesson
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium disabled:opacity-60 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving
              ? "Saving Course..."
              : isEdit
                ? "Update Course"
                : "Create Course"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CourseForm;
