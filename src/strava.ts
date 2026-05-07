import { z } from "zod";

const STRAVA_AUTH_URL = "https://www.strava.com/oauth/token";
const STRAVA_API_BASE_URL = "https://www.strava.com/api/v3";
const ACCESS_TOKEN_REFRESH_SKEW_SECONDS = 60;
const STRAVA_PAGE_SIZE = 200;

const refreshTokenResponseSchema = z.object({
  access_token: z.string().min(1),
  expires_at: z.number().int().positive(),
  refresh_token: z.string().min(1),
});

export const stravaEnvSchema = z.object({
  STRAVA_CLIENT_ID: z.string().min(1),
  STRAVA_CLIENT_SECRET: z.string().min(1),
  STRAVA_REFRESH_TOKEN: z.string().min(1),
});

export type StravaEnv = z.infer<typeof stravaEnvSchema>;

export interface StravaMap {
  id?: string | null;
  summary_polyline?: string | null;
  polyline?: string | null;
}

export interface StravaSplit {
  split?: number;
  distance?: number;
  elapsed_time?: number;
  moving_time?: number;
  elevation_difference?: number | null;
  average_speed?: number | null;
  average_heartrate?: number | null;
  average_grade_adjusted_speed?: number | null;
  pace_zone?: number | null;
}

export interface StravaLap {
  lap_index?: number;
  name?: string | null;
  distance?: number;
  elapsed_time?: number;
  moving_time?: number;
  total_elevation_gain?: number | null;
  average_speed?: number | null;
  max_speed?: number | null;
  average_heartrate?: number | null;
  average_watts?: number | null;
  average_cadence?: number | null;
}

export interface StravaActivity {
  id: number;
  name?: string | null;
  sport_type?: string | null;
  type?: string | null;
  description?: string | null;
  start_date?: string | null;
  start_date_local?: string | null;
  timezone?: string | null;
  location_city?: string | null;
  location_state?: string | null;
  location_country?: string | null;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  average_speed?: number | null;
  max_speed?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  average_watts?: number | null;
  weighted_average_watts?: number | null;
  average_cadence?: number | null;
  average_temp?: number | null;
  kudos_count?: number | null;
  comment_count?: number | null;
  achievement_count?: number | null;
  kilojoules?: number | null;
  calories?: number | null;
  suffer_score?: number | null;
  gear_id?: string | null;
  trainer?: boolean | null;
  commute?: boolean | null;
  manual?: boolean | null;
  private?: boolean | null;
  flagged?: boolean | null;
  device_watts?: boolean | null;
  has_heartrate?: boolean | null;
  map?: StravaMap | null;
  splits_metric?: StravaSplit[] | null;
  splits_standard?: StravaSplit[] | null;
  laps?: StravaLap[] | null;
}

export interface StravaActivityStream {
  data: unknown[];
  original_size?: number | null;
  resolution?: string | null;
  series_type?: string | null;
}

export type StravaStreamSet = Record<string, StravaActivityStream>;

export class StravaApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "StravaApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatApiErrorMessage(
  defaultMessage: string,
  response: Response,
  payload: unknown,
): string {
  const parts: string[] = [defaultMessage];

  if (response.status) {
    parts.push(`HTTP ${response.status}`);
  }

  if (isRecord(payload) && typeof payload.message === "string") {
    parts.push(payload.message);
  } else if (typeof payload === "string" && payload.trim().length > 0) {
    parts.push(payload.trim());
  } else if (response.statusText) {
    parts.push(response.statusText);
  }

  if (isRecord(payload) && Array.isArray(payload.errors) && payload.errors.length > 0) {
    const errorDetails = payload.errors
      .map((entry) => {
        if (!isRecord(entry)) {
          return null;
        }

        const resource = typeof entry.resource === "string" ? entry.resource : null;
        const field = typeof entry.field === "string" ? entry.field : null;
        const code = typeof entry.code === "string" ? entry.code : null;

        return [resource, field, code].filter(Boolean).join(".");
      })
      .filter((entry): entry is string => Boolean(entry))
      .join(", ");

    if (errorDetails) {
      parts.push(`details: ${errorDetails}`);
    }
  }

  return parts.join(" - ");
}

async function readResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function unixTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function maskToken(token: string): string {
  return token.length <= 8 ? token : `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export class StravaClient {
  private accessToken: string | null = null;
  private accessTokenExpiresAt: number | null = null;
  private refreshToken: string;
  private refreshPromise: Promise<string> | null = null;

  constructor(private readonly env: StravaEnv) {
    this.refreshToken = env.STRAVA_REFRESH_TOKEN;
  }

  async listAthleteActivities(options: {
    after?: Date;
    before?: Date;
    limit?: number;
  } = {}): Promise<StravaActivity[]> {
    const results: StravaActivity[] = [];
    const limit = options.limit ?? Number.POSITIVE_INFINITY;
    let page = 1;

    while (results.length < limit) {
      const remaining = Number.isFinite(limit) ? limit - results.length : STRAVA_PAGE_SIZE;
      const perPage = Math.min(STRAVA_PAGE_SIZE, remaining);

      const pageResults = await this.apiGet<StravaActivity[]>("/athlete/activities", {
        page,
        per_page: perPage,
        after: options.after ? unixTimestamp(options.after) : undefined,
        before: options.before ? unixTimestamp(options.before) : undefined,
      });

      results.push(...pageResults);

      if (pageResults.length < perPage) {
        break;
      }

      page += 1;
    }

    return Number.isFinite(limit) ? results.slice(0, limit) : results;
  }

  async getActivity(activityId: number): Promise<StravaActivity> {
    return this.apiGet<StravaActivity>(`/activities/${activityId}`);
  }

  async getActivityStreams(activityId: number, keys: string[]): Promise<StravaStreamSet> {
    return this.apiGet<StravaStreamSet>(`/activities/${activityId}/streams`, {
      keys: keys.join(","),
      key_by_type: true,
    });
  }

  private async apiGet<T>(
    path: string,
    query: Record<string, string | number | boolean | undefined> = {},
  ): Promise<T> {
    const accessToken = await this.getValidAccessToken();
    const url = new URL(`${STRAVA_API_BASE_URL}${path}`);

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new StravaApiError(
        formatApiErrorMessage("Strava API request failed", response, body),
        response.status,
        body,
      );
    }

    return body as T;
  }

  private async getValidAccessToken(): Promise<string> {
    const now = Math.floor(Date.now() / 1000);

    if (
      this.accessToken &&
      this.accessTokenExpiresAt &&
      now < this.accessTokenExpiresAt - ACCESS_TOKEN_REFRESH_SKEW_SECONDS
    ) {
      return this.accessToken;
    }

    if (!this.refreshPromise) {
      this.refreshPromise = this.refreshAccessToken().finally(() => {
        this.refreshPromise = null;
      });
    }

    return this.refreshPromise;
  }

  private async refreshAccessToken(): Promise<string> {
    const body = new URLSearchParams({
      client_id: this.env.STRAVA_CLIENT_ID,
      client_secret: this.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });

    const response = await fetch(STRAVA_AUTH_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const payload = await readResponseBody(response);

    if (!response.ok) {
      throw new StravaApiError(
        formatApiErrorMessage("Failed to refresh Strava access token", response, payload),
        response.status,
        payload,
      );
    }

    const parsedPayload = refreshTokenResponseSchema.safeParse(payload);

    if (!parsedPayload.success) {
      throw new StravaApiError("Strava token response was missing expected fields", response.status, payload);
    }

    const { access_token, expires_at, refresh_token } = parsedPayload.data;

    if (refresh_token !== this.refreshToken) {
      console.warn(
        [
          "Strava returned a new refresh token.",
          "Update STRAVA_REFRESH_TOKEN in your local .env file.",
          `old=${maskToken(this.refreshToken)}`,
          `new=${maskToken(refresh_token)}`,
        ].join(" "),
      );
    }

    this.refreshToken = refresh_token;
    this.accessToken = access_token;
    this.accessTokenExpiresAt = expires_at;

    return access_token;
  }
}
