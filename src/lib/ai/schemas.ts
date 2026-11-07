import { z } from 'zod';

export const farmingInput = z.object({
  task: z.enum(['chat', 'planner', 'fertilizer', 'disease', 'market']),
  language: z.enum(['marathi', 'hindi', 'english']),
  payload: z.record(z.unknown()),
});
export type FarmingInput = z.infer<typeof farmingInput>;
export const textResult = z.object({ rawResponse: z.string() });
export const marketResult = z.object({ summary: z.string(), sellingTips: z.array(z.string()) });
export const diseaseResult = z.object({
  overallHealth: z.enum(['good', 'moderate', 'poor', 'unknown']),
  diseases: z.array(z.object({ name: z.string(), description: z.string(), symptoms: z.array(z.string()), prevention: z.array(z.string()) })),
});

export function validateFarmingInput(input: unknown): FarmingInput {
  const data = farmingInput.parse(input);
  if (JSON.stringify(data).length > 7_100_000) throw new Error('Request is too large.');
  if (data.task === 'disease') {
    if (typeof data.payload.imageBase64 !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.payload.imageBase64)) throw new Error('Please upload a JPG, PNG or WebP crop photo.');
  } else if (data.task === 'chat') {
    if (typeof data.payload.message !== 'string' || !data.payload.message.trim() || data.payload.message.length > 8000) throw new Error('Please enter a question under 8,000 characters.');
  } else if (data.task === 'planner' || data.task === 'fertilizer') {
    const area = data.task === 'planner' ? data.payload.area : data.payload.landArea;
    if (typeof area !== 'number' || !Number.isFinite(area) || area <= 0 || typeof data.payload.crop !== 'string' || !data.payload.crop.trim()) throw new Error('Please select a crop and a valid positive land area.');
    if (data.task === 'fertilizer' && !['acre', 'hectare', 'guntha'].includes(String(data.payload.landUnit))) throw new Error('Invalid land unit.');
  }
  return data;
}

export function safeDiseaseResult(value: z.infer<typeof diseaseResult>) {
  return { ...value, diseases: value.diseases.slice(0, 3).map(d => ({ ...d, organicTreatment: [], chemicalTreatment: [] })) };
}

export const advisoryNotice = {
  marathi: 'Gemini AI मार्गदर्शन — हा अंदाज आहे, निश्चित निदान नाही. माती तपासणी व कृषी तज्ज्ञांच्या सल्ल्याशिवाय खत किंवा औषधाची मात्रा ठरवू नका.',
  hindi: 'Gemini AI मार्गदर्शन — यह अनुमान है, निश्चित निदान नहीं। मिट्टी परीक्षण और कृषि विशेषज्ञ की सलाह के बिना खाद या दवा की मात्रा तय न करें।',
  english: 'Gemini AI guidance — an estimate, not a confirmed diagnosis. Confirm fertilizer and pesticide doses with a soil test and qualified agricultural expert.',
};