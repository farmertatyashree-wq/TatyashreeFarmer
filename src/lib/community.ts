export const COMMUNITY_MAX_POST_LENGTH = 1200;
export const COMMUNITY_MAX_TAGS = 5;
export const COMMUNITY_MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const COMMUNITY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

const phoneNumberPattern = /(?:^|\D)\+?\d(?:[\s().-]*\d){9,12}(?:\D|$)/;
const exactCoordinatesPattern = /-?\d{1,3}\.\d{4,}\s*[,/]\s*-?\d{1,3}\.\d{4,}/;

export function parseCropTags(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

export function validateCommunityText(value: string): string | null {
  const text = value.trim();
  if (phoneNumberPattern.test(text)) {
    return "Remove phone numbers before posting.";
  }
  if (exactCoordinatesPattern.test(text)) {
    return "Remove exact GPS coordinates before posting.";
  }
  return null;
}

export function validateCommunityPost(input: {
  body: string;
  authorName: string;
  cropTags: string[];
  village?: string;
  district?: string;
}): string | null {
  const body = input.body.trim();
  if (!body) return "Write an update before posting.";
  if (body.length > COMMUNITY_MAX_POST_LENGTH) {
    return `Updates can be up to ${COMMUNITY_MAX_POST_LENGTH} characters.`;
  }
  const authorName = input.authorName.trim();
  if (!authorName || authorName.length > 80) {
    return "Add a farmer name of up to 80 characters.";
  }
  if (input.cropTags.length > COMMUNITY_MAX_TAGS) {
    return `Add no more than ${COMMUNITY_MAX_TAGS} crop tags.`;
  }
  if (input.cropTags.some((tag) => tag.length > 32)) {
    return "Each crop tag must be 32 characters or fewer.";
  }
  const privateDataError = validateCommunityText(
    [body, input.authorName, input.village ?? "", input.district ?? "", ...input.cropTags].join(
      " ",
    ),
  );
  if (privateDataError) return privateDataError;
  return null;
}

export function validateCommunityImage(file: File): string | null {
  if (!(COMMUNITY_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Choose a JPG, PNG, or WebP image.";
  }
  if (file.size === 0 || file.size > COMMUNITY_MAX_IMAGE_SIZE) {
    return "Images must be up to 5 MB.";
  }
  return null;
}
