export interface AccomodationImage {
  id: number;
  accomodation_id: number;
  image_id: string;
  img_name: string;
  image_title: string;
  type_id: number;
  type: string;
  sub_index: number;
  webp: boolean;
  wellness_text: string | null;
  small: string;
  medium: string;
  original: string;
  src: string;
  thumb: string;
}
