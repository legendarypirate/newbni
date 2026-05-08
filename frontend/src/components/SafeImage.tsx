"use client";

import { useEffect, useState, type ImgHTMLAttributes, type ReactNode } from "react";

type SafeImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> & {
  /** Source URL. Empty / null / undefined values render the fallback immediately. */
  src: string | null | undefined;
  /** Required alt text (for accessibility — never rendered visually). */
  alt: string;
  /** Rendered when the image fails to load or the src is empty. */
  fallback: ReactNode;
};

/**
 * `SafeImage` renders a regular `<img>` and swaps to `fallback` on the first
 * `error` event (HTTP 404, blocked, malformed URL, etc). Use this everywhere
 * a remote / Cloudinary photo is shown so a missing asset never blows the
 * layout with the broken-image icon + overflowing alt text.
 *
 * Usage:
 *   <SafeImage
 *     src={mediaUrl(member.photo)}
 *     alt={member.name}
 *     fallback={<i className="fa-solid fa-user" />}
 *   />
 */
export default function SafeImage({ src, alt, fallback, ...rest }: SafeImageProps) {
  const url = (src ?? "").trim();
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    setErrored(false);
  }, [url]);

  if (!url || errored) {
    return <>{fallback}</>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={url}
      alt={alt}
      onError={() => setErrored(true)}
    />
  );
}
