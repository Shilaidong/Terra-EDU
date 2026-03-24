export const avatarPresetValues = [
  "/api/assets/avatar/a1.png",
  "/api/assets/avatar/a2.png",
  "/api/assets/avatar/a3.png",
  "/api/assets/avatar/a4.png",
  "/api/assets/avatar/a5.png",
  "/api/assets/avatar/a6.png",
  "/api/assets/avatar/a7.png",
  "/api/assets/avatar/a8.png",
  "/api/assets/avatar/a9.png",
  "/api/assets/avatar/a10.png",
] as const;

export type AvatarPresetValue = (typeof avatarPresetValues)[number];

export const avatarPresets: {
  value: AvatarPresetValue;
  label: string;
}[] = [
  {
    value: avatarPresetValues[0],
    label: "Avatar 01",
  },
  {
    value: avatarPresetValues[1],
    label: "Avatar 02",
  },
  {
    value: avatarPresetValues[2],
    label: "Avatar 03",
  },
  {
    value: avatarPresetValues[3],
    label: "Avatar 04",
  },
  {
    value: avatarPresetValues[4],
    label: "Avatar 05",
  },
  {
    value: avatarPresetValues[5],
    label: "Avatar 06",
  },
  {
    value: avatarPresetValues[6],
    label: "Avatar 07",
  },
  {
    value: avatarPresetValues[7],
    label: "Avatar 08",
  },
  {
    value: avatarPresetValues[8],
    label: "Avatar 09",
  },
  {
    value: avatarPresetValues[9],
    label: "Avatar 10",
  },
];

export function getDefaultStudentAvatar() {
  return avatarPresetValues[0];
}
