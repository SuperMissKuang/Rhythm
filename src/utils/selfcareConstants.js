export const TIME_OPTIONS = [
  { value: "Early Morning", label: "Early Morning (6-9 AM)" },
  { value: "Late Morning", label: "Late Morning (9 AM-12 PM)" },
  { value: "Afternoon", label: "Afternoon (12-5 PM)" },
  { value: "Evening", label: "Evening (5-9 PM)" },
  { value: "Night", label: "Night (9 PM+)" },
];

export const SELFCARE_CATEGORIES = [
  {
    id: 1,
    name: "Hair",
    color_hex: "#FFB6C1",
    light_saturation_min: 1,
    light_saturation_max: 2,
    medium_saturation_min: 3,
    medium_saturation_max: 4,
    dark_saturation_min: 5,
    activities: [
      { id: "hair_wash", name: "Hair Wash" },
      { id: "hair_mask", name: "Hair Mask" },
      { id: "hair_cut", name: "Hair Cut" },
    ],
    items: [
      { id: "hair_wash", name: "Hair Wash", activity_key: "hair_wash" },
      { id: "hair_mask", name: "Hair Mask", activity_key: "hair_mask" },
      { id: "hair_cut", name: "Hair Cut", activity_key: "hair_cut" },
    ],
  },
  {
    id: 2,
    name: "Skin",
    color_hex: "#87CEEB",
    light_saturation_min: 1,
    light_saturation_max: 2,
    medium_saturation_min: 3,
    medium_saturation_max: 4,
    dark_saturation_min: 5,
    activities: [
      { id: "exfoliation", name: "Exfoliation" },
      { id: "face_mask", name: "Face Mask" },
    ],
    items: [
      { id: "exfoliation", name: "Exfoliation", activity_key: "exfoliation" },
      { id: "face_mask", name: "Face Mask", activity_key: "face_mask" },
    ],
  },
];
