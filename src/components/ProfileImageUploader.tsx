import React, { useRef, useState } from "react";
import { Camera, Check, ImagePlus, LoaderCircle, Trash2 } from "lucide-react";

const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
const OUTPUT_SIZE = 512;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const createBuiltInAvatar = (background: string, accent: string, variant: number) => {
  const detail = variant % 3 === 0
    ? `<circle cx="256" cy="205" r="86" fill="${accent}"/><path d="M92 500c10-112 72-168 164-168s154 56 164 168" fill="${accent}"/>`
    : variant % 3 === 1
      ? `<rect x="170" y="118" width="172" height="172" rx="58" fill="${accent}"/><path d="M78 500c18-116 82-166 178-166s160 50 178 166" fill="${accent}"/>`
      : `<path d="M256 98l116 86-44 136H184l-44-136z" fill="${accent}"/><path d="M82 500c24-104 88-158 174-158s150 54 174 158" fill="${accent}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="72" fill="${background}"/><circle cx="64" cy="64" r="22" fill="#EC5B13"/>${detail}<path d="M0 446h512v66H0z" fill="#EC5B13" opacity=".9"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const BUILT_IN_AVATARS = [
  { name: "Ember", image: createBuiltInAvatar("#0D0D0D", "#EC5B13", 0) },
  { name: "Steel", image: createBuiltInAvatar("#141414", "#D4D4D4", 1) },
  { name: "Forge", image: createBuiltInAvatar("#1E1E1E", "#EC5B13", 2) },
  { name: "Ash", image: createBuiltInAvatar("#0D0D0D", "#A3A3A3", 3) },
  { name: "Heat", image: createBuiltInAvatar("#2A2A2A", "#EC5B13", 4) },
  { name: "Obsidian", image: createBuiltInAvatar("#141414", "#F5F5F5", 5) },
];

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

  const selectAvatar = (name: string, selectedImage: string) => {
    onImageChange(selectedImage);
    setError("");
    setStatus(`${name} avatar selected and saved on this device.`);
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

      <div className="rounded-xl border border-neutral-800 bg-neutral-950/45 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold text-neutral-200">Or choose a built-in avatar</p>
            <p className="text-[9px] text-neutral-600">Use an avatar without sharing a personal photo.</p>
          </div>
          <span className="rounded-md border border-orange-900/50 bg-orange-950/20 px-2 py-0.5 font-mono text-[8px] text-orange-300">PRIVATE</span>
        </div>
        <div className="grid grid-cols-6 gap-2">
          {BUILT_IN_AVATARS.map(avatar => {
            const selected = image === avatar.image;
            return (
              <button
                key={avatar.name}
                type="button"
                aria-label={`Choose ${avatar.name} avatar`}
                aria-pressed={selected}
                onClick={() => selectAvatar(avatar.name, avatar.image)}
                className={`relative rounded-lg border p-0.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
                  selected ? "border-orange-500 bg-orange-500/15" : "border-neutral-800 hover:border-neutral-600"
                }`}
              >
                <img src={avatar.image} alt="" className="aspect-square w-full rounded-md object-cover" />
                {selected && (
                  <span className="absolute -right-1 -top-1 rounded-full border-2 border-neutral-950 bg-orange-600 p-0.5 text-white">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                )}
              </button>
            );
          })}
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
