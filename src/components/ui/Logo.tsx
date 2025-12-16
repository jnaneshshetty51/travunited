"use client";

import { useState } from "react";
import Image from "next/image";

interface LogoProps {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
}

export function Logo({ width = 80, height = 32, className = "h-8 w-auto", priority = false }: LogoProps) {
  const [imgSrc, setImgSrc] = useState("/logo.svg");

  return (
    <Image
      src={imgSrc}
      alt="Travunited Logo"
      width={width}
      height={height}
      className={className}
      priority={priority}
      unoptimized={imgSrc.endsWith('.svg')}
      onError={() => {
        // Fallback to PNG if SVG fails to load
        if (imgSrc.endsWith('.svg')) {
          setImgSrc("/logo.png");
        }
      }}
    />
  );
}

