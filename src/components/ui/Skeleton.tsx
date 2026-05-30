'use client';

export default function Skeleton({
  width,
  height,
  className,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return (
    <div
      className={`skeleton ${className || ''}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius: 0,
      }}
    />
  );
}
