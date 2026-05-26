"use client";

import { useImageFilePreview } from "./useImageFilePreview";

type Props = {
  label: string;
  inputId: string;
  inputName: string;
  savedSrc: string;
  hint: string;
  maxHint?: string;
  previewHeight?: number;
};

export default function ProfileImageUploadBox({
  label,
  inputId,
  inputName,
  savedSrc,
  hint,
  maxHint,
  previewHeight = 100,
}: Props) {
  const { displaySrc, hasPendingPreview, onFileChange } = useImageFilePreview(savedSrc);

  return (
    <div className="pm-upload-box">
      <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
        <div className="pm-label mb-0">{label}</div>
        {hasPendingPreview ? (
          <span className="badge text-bg-primary" style={{ fontSize: "0.65rem" }}>
            Урьдчилсан харагдац
          </span>
        ) : null}
      </div>
      <div className="pm-upload-preview" style={{ height: previewHeight }}>
        {displaySrc ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob + remote URLs
          <img src={displaySrc} alt="" />
        ) : (
          <i className="fa-solid fa-image pm-upload-placeholder" />
        )}
      </div>
      <div className="pm-upload-info">
        {hint}
        {maxHint ? ` · ${maxHint}` : ""}
      </div>
      {hasPendingPreview ? (
        <div className="small text-primary mb-2">Хадгалах товч дарсны дараа серверт байршина.</div>
      ) : null}
      <button type="button" className="pm-btn-upload" onClick={() => document.getElementById(inputId)?.click()}>
        Файл сонгох
      </button>
      <input
        type="file"
        name={inputName}
        id={inputId}
        className="d-none"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onFileChange}
      />
    </div>
  );
}
