import React, { useRef, useState } from "react";
import { Camera, Check, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface ProfileImageUploaderProps {
  image: string;
  fallbackImage: string;
  displayName: string;
  onImageChange: (image: string) => void;
  compact?: boolean;
}

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("The selected image could not be read."));
    reader.readAsDataURL(file);
  });

const loadImage = (source: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("The selected file is not a valid image."));
    image.src = source;
  });

const prepareAvatar = async (file: File) => {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Choose a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error("Choose an image smaller than 5 MB.");
  }

  const source = await readFileAsDataUrl(file);
  const image = await loadImage(source);
  if (image.naturalWidth < 128 || image.naturalHeight < 128) {
    throw new Error("Choose an image at least 128 × 128 pixels.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot prepare the image.");

  const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = (image.naturalWidth - cropSize) / 2;
  const sourceY = (image.naturalHeight - cropSize) / 2;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    cropSize,
    cropSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  return canvas.toDataURL("image/webp", 0.84);
};

export default function ProfileImageUploader({
  image,
  fallbackImage,
  displayName,
  onImageChange,
  compact = false,
}: ProfileImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [processing, setProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const processFile = async (file?: File) => {
    if (!file || processing) return;
    setError("");
    setStatus("");
    setProcessing(true);
    try {
      const preparedImage = await prepareAvatar(file);
      onImageChange(preparedImage);
      setStatus("Profile image saved on this device.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "The image could not be prepared.");
    } finally {
      setProcessing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeImage = () => {
    onImageChange(fallbackImage);
    setError("");
    setStatus("Custom profile image removed.");
  };

  return (
    <div className={`space-y-2 ${compact ? "w-full sm:w-auto" : "w-full"}`}>
      <div
        onDragEnter={event => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={event => event.preventDefault()}
        onDragLeave={event => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={event => {
          event.preventDefault();
          setDragActive(false);
          void processFile(event.dataTransfer.files[0]);
        }}
        className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
          dragActive ? "border-orange-500 bg-orange-950/20" : "border-neutral-800 bg-neutral-950/70"
        }`}
      >
        <div className="relative shrink-0">
          <img
            src={image}
            alt={`${displayName || "Member"} profile`}
            className={`${compact ? "h-20 w-20" : "h-24 w-24"} rounded-xl border border-neutral-700 object-cover`}
          />
          <span className="absolute -bottom-1 -right-1 rounded-lg border-2 border-neutral-950 bg-orange-600 p-1.5 text-white">
            <Camera className="h-3.5 w-3.5" />
          </span>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-xs font-bold text-neutral-100">Profile image</p>
            <p className="text-[9px] leading-relaxed text-neutral-500">JPG, PNG, or WebP • 5 MB max • cropped square</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={processing}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-[10px] font-bold text-white transition-colors hover:bg-orange-500 disabled:cursor-wait disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {processing ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              {processing ? "Preparing…" : "Upload image"}
            </button>
            {image !== fallbackImage && (
              <button
                type="button"
                onClick={removeImage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-[10px] font-bold text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={event => void processFile(event.target.files?.[0])}
        className="sr-only"
        aria-label="Choose profile image"
      />

      <p className="px-1 text-[9px] text-neutral-600">Processed in your browser and stored only on this device.</p>
      {error && <p role="alert" className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-[10px] text-red-300">{error}</p>}
      {status && <p role="status" className="flex items-center gap-1.5 px-1 text-[10px] text-emerald-400"><Check className="h-3.5 w-3.5" /> {status}</p>}
    </div>
  );
}
