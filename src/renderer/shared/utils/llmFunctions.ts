import type { ClientFromData } from '../types/client';

export type ClientSmartFillResult = Partial<
  Pick<
    ClientFromData,
    | 'name'
    | 'shortName'
    | 'address'
    | 'code'
    | 'email'
    | 'phone'
    | 'description'
    | 'vatCode'
    | 'peppolEndpointId'
    | 'peppolEndpointSchemeId'
    | 'buyerReference'
    | 'countryCode'
    | 'additional'
  >
>;

interface LlmConfig {
  apiUrl?: string;
  apiKey?: string;
  model?: string;
}

const FIELD_KEYS: Array<keyof ClientSmartFillResult> = [
  'name',
  'shortName',
  'address',
  'code',
  'email',
  'phone',
  'description',
  'vatCode',
  'peppolEndpointId',
  'peppolEndpointSchemeId',
  'buyerReference',
  'countryCode',
  'additional'
];

const SYSTEM_PROMPT = `You extract structured client/customer contact data from free-form text the user pastes.
Return ONLY a JSON object (no markdown, no code fences, no commentary) with any of these optional string keys:
- name: full company or person name
- shortName: a 1-2 character abbreviation/initials (max 2 chars)
- address: postal address
- code: client/customer code or registration number
- email: email address
- phone: phone number
- description: a short note/description
- vatCode: VAT / tax identification number
- countryCode: 2-letter ISO country code (uppercase)
- peppolEndpointId: Peppol endpoint id if explicitly present
- peppolEndpointSchemeId: Peppol endpoint scheme id if explicitly present
- buyerReference: buyer reference if explicitly present
- additional: any other relevant info that does not fit the fields above
Only include keys you can confidently infer from the text. Omit keys you are unsure about. Do not invent values.`;

const buildUrl = (base: string): string => {
  const trimmed = base.trim().replace(/\/+$/, '');
  if (/\/chat\/completions$/.test(trimmed)) return trimmed;
  if (/\/v\d+$/.test(trimmed)) return `${trimmed}/chat/completions`;
  return `${trimmed}/chat/completions`;
};

const stripFences = (text: string): string => {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) return fenced[1].trim();
  return text.trim();
};

const extractJsonObject = (text: string): Record<string, unknown> | null => {
  const cleaned = stripFences(text);
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
};

const sanitize = (raw: Record<string, unknown>): ClientSmartFillResult => {
  const result: ClientSmartFillResult = {};
  for (const key of FIELD_KEYS) {
    const value = raw[key];
    if (typeof value === 'string' && value.trim() !== '') {
      let v = value.trim();
      if (key === 'shortName') v = v.slice(0, 2);
      if (key === 'countryCode') v = v.slice(0, 2).toUpperCase();
      result[key] = v;
    } else if (typeof value === 'number') {
      result[key] = String(value);
    }
  }
  return result;
};

export const smartFillClient = async (text: string, config: LlmConfig): Promise<ClientSmartFillResult> => {
  if (!config.apiUrl || !config.model) {
    throw new Error('llm-not-configured');
  }

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.apiKey) headers.Authorization = `Bearer ${config.apiKey}`;

  const response = await fetch(buildUrl(config.apiUrl), {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: config.model,
      temperature: 0,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text }
      ],
      response_format: { type: 'json_object' }
    })
  });

  if (!response.ok) {
    throw new Error(`llm-request-failed:${response.status}`);
  }

  const data = await response.json();
  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('llm-empty-response');
  }

  const parsed = extractJsonObject(content);
  if (!parsed) {
    throw new Error('llm-parse-failed');
  }

  return sanitize(parsed);
};
