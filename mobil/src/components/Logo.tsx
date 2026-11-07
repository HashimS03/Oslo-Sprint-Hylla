import Svg, { Path, Rect } from "react-native-svg";

/** Hylla-logoen, samme som i dashboardet: gul flis med mørk ramme og tre hyllestreker. */
export function Logo({ size = 30 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect width="512" height="512" rx="96" fill="#F4C430" />
      <Rect x="158" y="158" width="196" height="196" fill="none" stroke="#1B2226" strokeWidth="30" />
      <Path d="M203 199h106M203 256h106M203 312h106" stroke="#1B2226" strokeWidth="16" />
    </Svg>
  );
}
