import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import {
  StravaApiError,
  StravaClient,
  type StravaActivity,
  type StravaActivityStream,
  type StravaLap,
  type StravaSplit,
} from "./strava.js";

const DEFAULT_RECENT_DAYS = 14;
const DEFAULT_RECENT_LIMIT = 30;
const DEFAULT_SUMMARY_WEEKS = 4;
const STREAM_KEYS = [
  "time",
  "distance",
  "latlng",
  "altitude",
  "velocity_smooth",
  "heartrate",
  "cadence",
  "watts",
  "temp",
  "moving",
  "grade_smooth",
] as const;
const DEFAULT_STREAM_KEYS = [
  "time",
  "heartrate",
  "watts",
  "velocity_smooth",
  "distance",
  "cadence",
] as const;

type StreamKey = (typeof STREAM_KEYS)[number];
type WeeklyBucketName = "swim" | "bike" | "run" | "other";

type SimplifiedActivity = ReturnType<typeof simplifyActivity>;

type WeeklyBucketAccumulator = {
  activity_count: number;
  total_distance_km: number;
  total_moving_time_min: number;
  total_elev_gain_m: number;
  average_heartrate: number | null;
  average_watts: number | null;
  activities: SimplifiedActivity[];
  hr_weighted_sum: number;
  hr_weight_total: number;
  watts_weighted_sum: number;
  watts_weight_total: number;
};

type WeeklySummaryAccumulator = {
  week_start: string;
  week_end: string;
  swim: WeeklyBucketAccumulator;
  bike: WeeklyBucketAccumulator;
  run: WeeklyBucketAccumulator;
  other: WeeklyBucketAccumulator;
  totals: WeeklyBucketAccumulator;
};

const looseObject = z.object({}).passthrough();
const streamKeySchema = z.enum([...STREAM_KEYS] as [StreamKey, ...StreamKey[]]);

function createTextContent(payload: Record<string, unknown>) {
  return [
    {
      type: "text" as const,
      text: JSON.stringify(payload, null, 2),
    },
  ];
}

function createSuccessResult(payload: Record<string, unknown>) {
  return {
    content: createTextContent(payload),
    structuredContent: payload,
  };
}

function formatToolError(error: unknown): string {
  if (error instanceof StravaApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function createErrorResult(error: unknown) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: formatToolError(error),
      },
    ],
  };
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function metersToKm(value: number | null | undefined): number {
  return round((value ?? 0) / 1000, 2);
}

function secondsToMinutes(value: number | null | undefined): number {
  return round((value ?? 0) / 60, 1);
}

function numberOrNull(value: number | null | undefined, digits = 2): number | null {
  return typeof value === "number" && Number.isFinite(value) ? round(value, digits) : null;
}

function booleanOrNull(value: boolean | null | undefined): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function stringOrNull(value: string | null | undefined): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function simplifyActivity(activity: StravaActivity) {
  return {
    id: activity.id,
    name: stringOrNull(activity.name),
    sport_type: stringOrNull(activity.sport_type),
    type: stringOrNull(activity.type),
    start_date: stringOrNull(activity.start_date),
    distance_km: metersToKm(activity.distance),
    moving_time_min: secondsToMinutes(activity.moving_time),
    elapsed_time_min: secondsToMinutes(activity.elapsed_time),
    average_heartrate: numberOrNull(activity.average_heartrate, 1),
    max_heartrate: numberOrNull(activity.max_heartrate, 1),
    average_watts: numberOrNull(activity.average_watts, 1),
    weighted_average_watts: numberOrNull(activity.weighted_average_watts, 1),
    elev_gain_m: round(activity.total_elevation_gain ?? 0, 1),
    average_speed: numberOrNull(activity.average_speed, 3),
    kudos_count: numberOrNull(activity.kudos_count, 0),
  };
}

function simplifySplit(split: StravaSplit, index: number) {
  return {
    split: split.split ?? index + 1,
    distance_km: metersToKm(split.distance),
    moving_time_min: secondsToMinutes(split.moving_time),
    elapsed_time_min: secondsToMinutes(split.elapsed_time),
    elevation_difference_m: numberOrNull(split.elevation_difference, 1),
    average_speed: numberOrNull(split.average_speed, 3),
    average_heartrate: numberOrNull(split.average_heartrate, 1),
    average_grade_adjusted_speed: numberOrNull(split.average_grade_adjusted_speed, 3),
    pace_zone: numberOrNull(split.pace_zone, 0),
  };
}

function simplifyLap(lap: StravaLap, index: number) {
  return {
    lap_index: lap.lap_index ?? index + 1,
    name: stringOrNull(lap.name),
    distance_km: metersToKm(lap.distance),
    moving_time_min: secondsToMinutes(lap.moving_time),
    elapsed_time_min: secondsToMinutes(lap.elapsed_time),
    elev_gain_m: numberOrNull(lap.total_elevation_gain, 1),
    average_speed: numberOrNull(lap.average_speed, 3),
    max_speed: numberOrNull(lap.max_speed, 3),
    average_heartrate: numberOrNull(lap.average_heartrate, 1),
    average_watts: numberOrNull(lap.average_watts, 1),
    average_cadence: numberOrNull(lap.average_cadence, 1),
  };
}

function simplifyDetailedActivity(activity: StravaActivity) {
  return {
    id: activity.id,
    name: stringOrNull(activity.name),
    description: stringOrNull(activity.description),
    sport_type: stringOrNull(activity.sport_type),
    type: stringOrNull(activity.type),
    start_date: stringOrNull(activity.start_date),
    start_date_local: stringOrNull(activity.start_date_local),
    timezone: stringOrNull(activity.timezone),
    location_city: stringOrNull(activity.location_city),
    location_state: stringOrNull(activity.location_state),
    location_country: stringOrNull(activity.location_country),
    distance_km: metersToKm(activity.distance),
    moving_time_min: secondsToMinutes(activity.moving_time),
    elapsed_time_min: secondsToMinutes(activity.elapsed_time),
    elev_gain_m: round(activity.total_elevation_gain ?? 0, 1),
    average_speed: numberOrNull(activity.average_speed, 3),
    max_speed: numberOrNull(activity.max_speed, 3),
    average_cadence: numberOrNull(activity.average_cadence, 1),
    average_temp: numberOrNull(activity.average_temp, 1),
    average_heartrate: numberOrNull(activity.average_heartrate, 1),
    max_heartrate: numberOrNull(activity.max_heartrate, 1),
    average_watts: numberOrNull(activity.average_watts, 1),
    weighted_average_watts: numberOrNull(activity.weighted_average_watts, 1),
    kilojoules: numberOrNull(activity.kilojoules, 1),
    calories: numberOrNull(activity.calories, 1),
    suffer_score: numberOrNull(activity.suffer_score, 1),
    kudos_count: numberOrNull(activity.kudos_count, 0),
    comment_count: numberOrNull(activity.comment_count, 0),
    achievement_count: numberOrNull(activity.achievement_count, 0),
    gear_id: stringOrNull(activity.gear_id),
    trainer: booleanOrNull(activity.trainer),
    commute: booleanOrNull(activity.commute),
    manual: booleanOrNull(activity.manual),
    private: booleanOrNull(activity.private),
    flagged: booleanOrNull(activity.flagged),
    device_watts: booleanOrNull(activity.device_watts),
    has_heartrate: booleanOrNull(activity.has_heartrate),
    map: {
      id: stringOrNull(activity.map?.id),
      summary_polyline: stringOrNull(activity.map?.summary_polyline),
      polyline: stringOrNull(activity.map?.polyline),
    },
    splits_metric: (activity.splits_metric ?? []).map(simplifySplit),
    splits_standard: (activity.splits_standard ?? []).map(simplifySplit),
    laps: (activity.laps ?? []).map(simplifyLap),
  };
}

function getActivityDate(activity: StravaActivity): string | null {
  const source = activity.start_date_local ?? activity.start_date;

  if (!source) {
    return null;
  }

  const dateText = source.slice(0, 10);

  return /^\d{4}-\d{2}-\d{2}$/.test(dateText) ? dateText : null;
}

function dateToYmd(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function ymdToUtcDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function shiftYmd(value: string, days: number): string {
  const date = ymdToUtcDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function getWeekStartMonday(value: string): string {
  const date = ymdToUtcDate(value);
  const day = date.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
}

function startOfLocalDay(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

function bucketForActivity(activity: StravaActivity): WeeklyBucketName {
  const sport = (activity.sport_type ?? activity.type ?? "").toLowerCase();

  if (sport.includes("swim")) {
    return "swim";
  }

  if (
    sport.includes("ride") ||
    sport.includes("bike") ||
    sport.includes("cycle") ||
    sport.includes("handcycle") ||
    sport.includes("velomobile")
  ) {
    return "bike";
  }

  if (sport.includes("run")) {
    return "run";
  }

  return "other";
}

function createBucketAccumulator(): WeeklyBucketAccumulator {
  return {
    activity_count: 0,
    total_distance_km: 0,
    total_moving_time_min: 0,
    total_elev_gain_m: 0,
    average_heartrate: null,
    average_watts: null,
    activities: [],
    hr_weighted_sum: 0,
    hr_weight_total: 0,
    watts_weighted_sum: 0,
    watts_weight_total: 0,
  };
}

function accumulateBucket(bucket: WeeklyBucketAccumulator, activity: StravaActivity): void {
  const simplifiedActivity = simplifyActivity(activity);
  const movingTimeSeconds = activity.moving_time ?? 0;

  bucket.activity_count += 1;
  bucket.total_distance_km = round(bucket.total_distance_km + simplifiedActivity.distance_km, 2);
  bucket.total_moving_time_min = round(
    bucket.total_moving_time_min + simplifiedActivity.moving_time_min,
    1,
  );
  bucket.total_elev_gain_m = round(bucket.total_elev_gain_m + simplifiedActivity.elev_gain_m, 1);
  bucket.activities.push(simplifiedActivity);

  if (simplifiedActivity.average_heartrate !== null && movingTimeSeconds > 0) {
    bucket.hr_weighted_sum += simplifiedActivity.average_heartrate * movingTimeSeconds;
    bucket.hr_weight_total += movingTimeSeconds;
  }

  if (simplifiedActivity.average_watts !== null && movingTimeSeconds > 0) {
    bucket.watts_weighted_sum += simplifiedActivity.average_watts * movingTimeSeconds;
    bucket.watts_weight_total += movingTimeSeconds;
  }
}

function finalizeBucket(bucket: WeeklyBucketAccumulator) {
  return {
    activity_count: bucket.activity_count,
    total_distance_km: round(bucket.total_distance_km, 2),
    total_moving_time_min: round(bucket.total_moving_time_min, 1),
    total_elev_gain_m: round(bucket.total_elev_gain_m, 1),
    average_heartrate:
      bucket.hr_weight_total > 0 ? round(bucket.hr_weighted_sum / bucket.hr_weight_total, 1) : null,
    average_watts:
      bucket.watts_weight_total > 0
        ? round(bucket.watts_weighted_sum / bucket.watts_weight_total, 1)
        : null,
    activities: bucket.activities,
  };
}

function createWeeklyAccumulator(weekStart: string): WeeklySummaryAccumulator {
  return {
    week_start: weekStart,
    week_end: shiftYmd(weekStart, 6),
    swim: createBucketAccumulator(),
    bike: createBucketAccumulator(),
    run: createBucketAccumulator(),
    other: createBucketAccumulator(),
    totals: createBucketAccumulator(),
  };
}

function buildWeeklySummary(activities: StravaActivity[], requestedWeeks: number) {
  const currentWeekStart = getWeekStartMonday(dateToYmd(new Date()));
  const weekStarts = Array.from({ length: requestedWeeks }, (_, index) =>
    shiftYmd(currentWeekStart, (index - requestedWeeks + 1) * 7),
  );
  const weekLookup = new Map<string, WeeklySummaryAccumulator>(
    weekStarts.map((weekStart) => [weekStart, createWeeklyAccumulator(weekStart)]),
  );

  for (const activity of activities) {
    const activityDate = getActivityDate(activity);

    if (!activityDate) {
      continue;
    }

    const weekStart = getWeekStartMonday(activityDate);
    const weekSummary = weekLookup.get(weekStart);

    if (!weekSummary) {
      continue;
    }

    const bucketName = bucketForActivity(activity);
    accumulateBucket(weekSummary[bucketName], activity);
    accumulateBucket(weekSummary.totals, activity);
  }

  return {
    requested_weeks: requestedWeeks,
    week_start_day: "monday" as const,
    generated_at: new Date().toISOString(),
    weeks: weekStarts.map((weekStart) => {
      const summary = weekLookup.get(weekStart)!;

      return {
        week_start: summary.week_start,
        week_end: summary.week_end,
        swim: finalizeBucket(summary.swim),
        bike: finalizeBucket(summary.bike),
        run: finalizeBucket(summary.run),
        other: finalizeBucket(summary.other),
        totals: finalizeBucket(summary.totals),
      };
    }),
  };
}

function simplifyStream(stream: StravaActivityStream) {
  return {
    original_size: numberOrNull(stream.original_size, 0),
    resolution: stringOrNull(stream.resolution),
    series_type: stringOrNull(stream.series_type),
    data: stream.data,
  };
}

export function registerStravaTools(server: McpServer, client: StravaClient): void {
  server.registerTool(
    "get_recent_activities",
    {
      description: "Get recent Strava activities simplified for training analysis.",
      inputSchema: {
        days: z.number().int().min(1).max(365).default(DEFAULT_RECENT_DAYS),
        limit: z.number().int().min(1).max(200).default(DEFAULT_RECENT_LIMIT),
      },
      outputSchema: {
        days: z.number(),
        limit: z.number(),
        activities: z.array(looseObject),
      },
    },
    async ({ days, limit }) => {
      try {
        const after = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const activities = await client.listAthleteActivities({ after, limit });
        const payload = {
          days,
          limit,
          activities: activities.map(simplifyActivity),
        };

        return createSuccessResult(payload);
      } catch (error) {
        return createErrorResult(error);
      }
    },
  );

  server.registerTool(
    "get_activity_details",
    {
      description: "Get a detailed Strava activity, simplified for training analysis.",
      inputSchema: {
        activityId: z.number().int().positive(),
      },
      outputSchema: {
        activity: looseObject,
      },
    },
    async ({ activityId }) => {
      try {
        const activity = await client.getActivity(activityId);
        const payload = {
          activity: simplifyDetailedActivity(activity),
        };

        return createSuccessResult(payload);
      } catch (error) {
        return createErrorResult(error);
      }
    },
  );

  server.registerTool(
    "get_weekly_training_summary",
    {
      description: "Get recent weekly training summaries grouped into swim, bike, run, and other.",
      inputSchema: {
        weeks: z.number().int().min(1).max(52).default(DEFAULT_SUMMARY_WEEKS),
      },
      outputSchema: {
        requested_weeks: z.number(),
        week_start_day: z.literal("monday"),
        generated_at: z.string(),
        weeks: z.array(looseObject),
      },
    },
    async ({ weeks }) => {
      try {
        const currentWeekStart = getWeekStartMonday(dateToYmd(new Date()));
        const oldestWeekStart = shiftYmd(currentWeekStart, (1 - weeks) * 7);
        const activities = await client.listAthleteActivities({
          after: startOfLocalDay(oldestWeekStart),
        });
        const payload = buildWeeklySummary(activities, weeks);

        return createSuccessResult(payload);
      } catch (error) {
        return createErrorResult(error);
      }
    },
  );

  server.registerTool(
    "get_activity_streams",
    {
      description: "Get Strava activity streams for training analysis.",
      inputSchema: {
        activityId: z.number().int().positive(),
        keys: z.array(streamKeySchema).min(1).default([...DEFAULT_STREAM_KEYS]),
      },
      outputSchema: {
        activityId: z.number(),
        requested_keys: z.array(z.string()),
        available_keys: z.array(z.string()),
        streams: z.record(looseObject),
      },
    },
    async ({ activityId, keys }) => {
      try {
        const streams = await client.getActivityStreams(activityId, keys);
        const simplifiedStreams = Object.fromEntries(
          Object.entries(streams).map(([key, value]) => [key, simplifyStream(value)]),
        );
        const payload = {
          activityId,
          requested_keys: keys,
          available_keys: Object.keys(simplifiedStreams),
          streams: simplifiedStreams,
        };

        return createSuccessResult(payload);
      } catch (error) {
        return createErrorResult(error);
      }
    },
  );
}
