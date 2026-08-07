import React from "react";
import type { Caption } from "@remotion/captions";
import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

const HIGHLIGHTS = [
  "心亡则忙",
  "禾急则稳",
  "心赖则懒",
  "竖心旁",
  "趣味联想",
  "形声字",
  "忙",
  "稳",
  "懒",
  "赖",
  "禾",
  "急",
  "心",
  "亡",
];

const highlightText = (text: string) => {
  const pattern = new RegExp(`(${HIGHLIGHTS.join("|")})`, "g");
  return text.split(pattern).map((part, index) => {
    const highlighted = HIGHLIGHTS.includes(part);
    return (
      <span key={`${part}-${index}`} style={{ color: highlighted ? "#ffd84d" : "#fff7df" }}>
        {part}
      </span>
    );
  });
};

export const CaptionBand: React.FC<{
  captions: Caption[];
  singleLine?: boolean;
}> = ({ captions, singleLine = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentMs = (frame / fps) * 1000;
  const active = captions.find(
    (caption) => currentMs >= caption.startMs && currentMs < caption.endMs,
  );
  const localMs = active ? currentMs - active.startMs : 0;
  const enter = active
    ? interpolate(localMs, [0, 150], [0.9, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 1;

  if (!active) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 50,
        left: 76,
        right: 96,
        bottom: 252,
        minHeight: 142,
        padding: "24px 38px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        border: "5px solid #fff7df",
        borderRadius: 30,
        background: "rgba(5, 29, 24, 0.94)",
        boxShadow: "12px 14px 0 rgba(0,0,0,0.2)",
        transform: `scale(${enter})`,
      }}
    >
      <div
        style={{
          color: "#fff7df",
          fontSize: singleLine ? 46 : active.text.length > 20 ? 40 : 46,
          fontWeight: 900,
          lineHeight: 1.35,
          textAlign: "center",
          letterSpacing: 1,
          whiteSpace: singleLine ? "nowrap" : "normal",
        }}
      >
        {highlightText(active.text)}
      </div>
    </div>
  );
};
