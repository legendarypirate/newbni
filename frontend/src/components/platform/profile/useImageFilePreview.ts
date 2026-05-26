"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useImageFilePreview(savedSrc: string) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const blobRef = useRef<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
    }
  }, []);

  useEffect(() => revokeBlob, [revokeBlob]);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      revokeBlob();
      const file = e.target.files?.[0];
      if (!file) {
        setPreviewSrc(null);
        return;
      }
      const url = URL.createObjectURL(file);
      blobRef.current = url;
      setPreviewSrc(url);
    },
    [revokeBlob],
  );

  const displaySrc = previewSrc || savedSrc;
  const hasPendingPreview = previewSrc !== null;

  return { displaySrc, hasPendingPreview, onFileChange };
}
