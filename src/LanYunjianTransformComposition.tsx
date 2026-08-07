import React from "react";
import type { Caption } from "@remotion/captions";
import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Composition,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import lanData from "hanzi-writer-data/懒.json";
import laiData from "hanzi-writer-data/赖.json";
import heartData from "hanzi-writer-data/心.json";
import { CaptionBand } from "./CaptionBand";
import captionsData from "./generated-lan-yunjian-captions.json";
import voiceover from "./generated-lan-yunjian-voiceover.json";

const FPS = 30;
const DURATION = Math.ceil(voiceover.videoDuration * FPS);
const CAPTIONS = captionsData as Caption[];
const BGM_FILE = "audio-lan-yunjian/background.mp3";

const COLORS = {
  board: "#103e36",
  cream: "#fff7df",
  yellow: "#ffd84d",
  red: "#ff6655",
  brown: "#8c5937",
  darkBrown: "#2c1b14",
};

type Point = readonly [number, number];

const medianLength = (points: readonly Point[]) =>
  points.slice(1).reduce((sum, point, index) => {
    const previous = points[index];
    return sum + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);

const lengths = lanData.medians.map((median) =>
  medianLength(median.map(([x, y]) => [x, y] as Point)),
);
const totalLength = lengths.reduce((sum, length) => sum + length, 0);
let spanCursor = 0;
const LAN_STROKES = lanData.strokes.map((shape, index) => {
  const start = spanCursor / totalLength;
  spanCursor += lengths[index];
  const end = spanCursor / totalLength;
  const median = lanData.medians[index]
    .map((point, pointIndex) =>
      `${pointIndex === 0 ? "M" : "L"} ${point[0]} ${point[1]}`,
    )
    .join(" ");
  return {
    shape,
    median,
    length: lengths[index],
    span: [start, end] as const,
    component: index < 3 ? ("heart" as const) : ("rely" as const),
  };
});

const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

const timedProgress = (
  frame: number,
  fps: number,
  startSeconds: number,
  endSeconds: number,
  easing = easeInOut,
) =>
  interpolate(
    frame,
    [startSeconds * fps, endSeconds * fps],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing,
    },
  );

const strokeProgress = (total: number, span: readonly [number, number]) =>
  interpolate(total, span, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const ChalkDust: React.FC = () => {
  const dots = Array.from({ length: 70 }, (_, index) => ({
    left: 4 + ((index * 37) % 92),
    top: 3 + ((index * 53) % 94),
    size: 1 + (index % 3),
    opacity: 0.03 + (index % 5) * 0.008,
  }));

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {dots.map((dot, index) => (
        <span
          key={index}
          style={{
            position: "absolute",
            left: `${dot.left}%`,
            top: `${dot.top}%`,
            width: dot.size,
            height: dot.size,
            borderRadius: 999,
            background: COLORS.cream,
            opacity: dot.opacity,
          }}
        />
      ))}
    </div>
  );
};

const BoardFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: COLORS.brown }}>
    <div
      style={{
        position: "absolute",
        inset: 28,
        overflow: "hidden",
        background: COLORS.board,
        border: `8px solid ${COLORS.darkBrown}`,
        boxShadow: "inset 0 0 95px rgba(0,0,0,0.34)",
      }}
    >
      <ChalkDust />
      {children}
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          bottom: 68,
          height: 34,
          borderRadius: "4px 4px 18px 18px",
          background: "#573724",
          boxShadow: `0 8px 0 ${COLORS.darkBrown}`,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 58,
            bottom: 15,
            width: 155,
            height: 25,
            borderRadius: 7,
            background: "#dcc878",
            boxShadow: "50px 0 0 #efd45c",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 92,
            bottom: 11,
            width: 80,
            height: 20,
            borderRadius: 5,
            background: COLORS.cream,
            boxShadow: `92px 0 0 ${COLORS.red}`,
          }}
        />
      </div>
    </div>
  </AbsoluteFill>
);

const TopStrokeWriting: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const totalProgress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 92,
        top: 74,
        height: 770,
        border: "4px solid rgba(255,247,223,0.28)",
        borderRadius: 34,
        background: "rgba(4,30,25,0.2)",
        padding: "18px 92px 10px",
        filter: "drop-shadow(7px 9px 0 rgba(0,0,0,0.14))",
      }}
    >
      <svg
        viewBox="0 0 1024 920"
        style={{ width: "100%", height: "100%", overflow: "visible" }}
      >
        <defs>
          {LAN_STROKES.map((stroke, index) => (
            <clipPath id={`lan-yunjian-top-${index}`} key={stroke.shape}>
              <path d={stroke.shape} />
            </clipPath>
          ))}
        </defs>
        <g transform="scale(1,-1) translate(0,-900)">
          {LAN_STROKES.map((stroke) => (
            <path
              key={`ghost-${stroke.shape}`}
              d={stroke.shape}
              fill={COLORS.cream}
              opacity={0.07}
            />
          ))}
          {LAN_STROKES.map((stroke, index) => {
            const local = strokeProgress(totalProgress, stroke.span);
            const fillOpacity = interpolate(local, [0.86, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const drawOpacity = interpolate(
              local,
              [0, 0.04, 0.94, 1],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            );

            return (
              <React.Fragment key={`stroke-${stroke.shape}`}>
                <path
                  d={stroke.shape}
                  fill={COLORS.cream}
                  opacity={fillOpacity}
                />
                <path
                  d={stroke.median}
                  fill="none"
                  stroke={COLORS.cream}
                  strokeWidth={118}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${stroke.length} ${stroke.length}`}
                  strokeDashoffset={stroke.length * (1 - local)}
                  opacity={drawOpacity}
                  clipPath={`url(#lan-yunjian-top-${index})`}
                />
              </React.Fragment>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const FilledPaths: React.FC<{
  paths: readonly string[];
  color: string;
}> = ({ paths, color }) => (
  <>
    {paths.map((path) => (
      <path key={path} d={path} fill={color} />
    ))}
  </>
);

const BottomTransformation: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = timedProgress(frame, fps, 0.25, 0.8125, easeOut);
  const split = timedProgress(frame, fps, 0.9375, 2.3125);
  const morph = timedProgress(frame, fps, 2.4375, 3.9375);

  const heartOffset = interpolate(split, [0, 1], [0, -44]);
  const relyOffset = interpolate(split, [0, 1], [0, 118]);
  const componentOpacity = 1 - morph;
  const standaloneOpacity = morph;
  const standaloneScale = interpolate(morph, [0, 1], [0.78, 1]);

  const radicalPaths = LAN_STROKES.filter(
    (stroke) => stroke.component === "heart",
  ).map((stroke) => stroke.shape);
  const relyComponentPaths = LAN_STROKES.filter(
    (stroke) => stroke.component === "rely",
  ).map((stroke) => stroke.shape);

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 92,
        top: 900,
        height: 520,
        border: "4px solid rgba(255,247,223,0.28)",
        borderRadius: 34,
        background: "rgba(4,30,25,0.2)",
        overflow: "hidden",
        filter: "drop-shadow(7px 9px 0 rgba(0,0,0,0.14))",
      }}
    >
      <svg
        viewBox="0 0 1024 900"
        style={{
          position: "absolute",
          left: 66,
          right: 66,
          top: 2,
          width: "calc(100% - 132px)",
          height: 470,
          overflow: "visible",
          opacity: enter,
        }}
      >
        <g transform="scale(1,-1) translate(0,-900)">
          <g
            opacity={componentOpacity}
            transform={`translate(${heartOffset} 0)`}
          >
            <FilledPaths paths={radicalPaths} color={COLORS.yellow} />
          </g>
          <g
            opacity={componentOpacity}
            transform={`translate(${relyOffset} 0)`}
          >
            <FilledPaths paths={relyComponentPaths} color={COLORS.red} />
          </g>
        </g>

        <g
          opacity={standaloneOpacity}
          transform={`translate(28 238) scale(${0.42 * standaloneScale})`}
        >
          <g transform="scale(1,-1) translate(0,-900)">
            <FilledPaths paths={heartData.strokes} color={COLORS.yellow} />
          </g>
        </g>
        <g
          opacity={standaloneOpacity}
          transform={`translate(516 202) scale(${0.48 * standaloneScale})`}
        >
          <g transform="scale(1,-1) translate(0,-900)">
            <FilledPaths paths={laiData.strokes} color={COLORS.red} />
          </g>
        </g>
      </svg>
    </div>
  );
};

export const LanYunjianTransformVideo: React.FC = () => {
  const { width, height } = useVideoConfig();
  if (width !== 1080 || height !== 1920) {
    throw new Error("LanYunjianTransformVideo expects a 1080x1920 composition.");
  }

  return (
    <BoardFrame>
      <Audio src={staticFile(BGM_FILE)} volume={0.8} loop />
      <Audio src={staticFile(voiceover.audioFile)} volume={1} />
      <TopStrokeWriting />
      <BottomTransformation />
      <CaptionBand captions={CAPTIONS} singleLine />
    </BoardFrame>
  );
};

export const LanYunjianTransformComposition: React.FC = () => (
  <Composition
    id="LanYunjianTransform"
    component={LanYunjianTransformVideo}
    durationInFrames={DURATION}
    fps={FPS}
    width={1080}
    height={1920}
  />
);
