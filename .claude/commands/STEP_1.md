# Athlete Baseline Intake Skill

## Purpose

Create a short but information-rich baseline profile for a new user before giving training, fitness, endurance, or performance advice.

The goal is to understand the user's basic physiological profile, training background, current fitness markers, and limitations.

Before asking the user questions, the agent should first try to extract as much baseline information as possible from available connected data sources, especially Strava or any available fitness/activity API.

Do **not** ask about races, event dates, race goals, running goals, target times, or future competitions in this intake. This questionnaire is only for collecting the user's baseline profile.

## Core Principle

Do not ask the user for information that can reasonably be inferred or retrieved from connected data.

First use available data. Then ask only for missing or uncertain fields.

Ask enough to be useful, but not so much that the user feels like they are filling out a medical tax form invented by a bored committee.

Target length after data extraction: **3 to 7 questions total**, depending on how much is missing.

If no connected data is available, use the full baseline questionnaire with **7 to 9 questions total**.

Use plain, friendly language. Keep questions easy to answer. Avoid overexplaining.

## Data Extraction First

Before showing any questionnaire, check whether the agent has access to Strava, Garmin, COROS, TrainingPeaks, Apple Health, Polar, Wahoo, Zwift, Rouvy, MyWhoosh, or any other fitness/activity API.

If access exists, extract or infer as much as possible from available data.

### Try to extract these fields first

1. **Basic profile**
   - sex / gender / training category, if available
   - age or birth year, if available
   - height, if available
   - weight, if available
   - location/timezone, if relevant for training context

2. **Training background**
   - main sports based on activity history
   - number of weeks/months/years visible in the activity history
   - training consistency
   - average weekly training volume
   - recent training frequency
   - longest recent activities by sport

3. **Performance benchmarks**
   - recent or all-time best efforts
   - examples: 5K, 10K, half marathon, marathon, cycling FTP, power curve, best 20 min power, swim pace
   - activity-derived estimates are allowed, but must be labeled as estimates

4. **Fitness metrics**
   - VO2max, if available
   - FTP, if available
   - resting HR, if available
   - max HR, if available
   - threshold HR, pace, or power, if available
   - HR zones or power zones, if available

5. **Current training structure**
   - sport distribution, e.g. running, cycling, swimming, strength
   - weekly session count
   - average duration
   - intensity distribution, if inferable
   - recent load trend, if available

6. **Recovery and fatigue indicators**
   - resting HR trend, if available
   - HRV, if available
   - recent fatigue/load/recovery status, if available
   - skipped sessions or sudden volume changes, if visible

7. **Equipment clues**
   - GPS watch or recording device
   - heart rate strap
   - power meter
   - smart trainer
   - bike type, if inferable
   - training apps/platforms used, e.g. Rouvy, Zwift, MyWhoosh, TrainerRoad

## Data Quality Rules

Use strict uncertainty handling.

- Do not pretend inferred data is confirmed.
- Label inferred values clearly.
- If sex, age, height, or weight are unavailable, ask the user.
- If performance benchmarks are inferred from activities, call them "estimated from activity data".
- If a field is stale, say so and ask for confirmation.
- If API data conflicts with the user's answer, trust the user's latest answer.
- If the API gives only partial data, summarize what is known and ask only for the missing essentials.
- Do not make medical assumptions from activity data.

## Baseline Summary Before Questions

After extracting data, show a short summary before asking follow-up questions.

Use this format:

```md
## What I could extract

- Age: [known / missing / inferred]
- Sex / training category: [known / missing / inferred]
- Height / weight: [known / missing / inferred]
- Main sports: [known / inferred]
- Recent weekly volume: [known / estimated]
- Benchmarks: [known / estimated / missing]
- Fitness metrics: [known / missing]
- Injuries or limitations: usually not available from API
- Training platforms/apps: [known / inferred / missing]
```

Then ask only the missing questions.

## Required Baseline Areas

The final user profile should ideally include these areas:

1. **Basic profile**
   - age
   - sex / training category
   - height
   - weight

2. **Training background**
   - how long they have trained consistently
   - main sports or activities
   - approximate weekly training volume

3. **Recent performance benchmarks**
   - personal bests or recent best efforts
   - examples: 5K, 10K, half marathon, marathon, FTP, swim pace, cycling power, gym lifts
   - the user can skip anything they do not know

4. **Current fitness metrics**
   - VO2max if available
   - resting HR
   - max HR
   - threshold HR / pace / power if available
   - wearable source if relevant, e.g. Garmin, COROS, Apple Watch, Polar, Wahoo

5. **Current training structure**
   - number of sessions per week
   - distribution across running, cycling, swimming, strength, mobility, or other sports

6. **Injuries and limitations**
   - current injuries
   - recurring pain
   - health issues that affect training
   - medications only if they directly affect exercise

7. **Recovery and lifestyle**
   - sleep
   - stress
   - job activity level
   - soreness/fatigue level

8. **Equipment and access**
   - watch / heart rate strap / bike trainer / gym / pool / bike / treadmill
   - training platforms/apps available, e.g. Rouvy, Zwift, MyWhoosh, TrainerRoad
   - only what matters for training recommendations

## Question Selection Rules

After extracting available data, ask only questions that fill important gaps.

Prioritize missing fields in this order:

1. Age, sex/training category, height, weight
2. Injuries, pain, health limitations
3. Training history and consistency
4. Current weekly training structure
5. Performance benchmarks not visible in data
6. Fitness metrics not visible in data
7. Recovery and lifestyle
8. Equipment/access not visible in data
9. Training platforms/apps available for structured workouts

Do not ask more than **7 questions** after data extraction.

If the API already provides most of the profile, ask only **2 to 4 questions**.

## Default Follow-up Questionnaire After Data Extraction

Use this when some data was extracted but important gaps remain:

```md
## Missing baseline info

I found some useful training data already. Please fill only the gaps below.

1. **Basic profile confirmation**  
   Age:  
   Sex / training category:  
   Height:  
   Weight:  

2. **Training background**  
   How long have you trained consistently?

3. **Benchmarks not visible in your activity data**  
   Any known PBs or test results I should use?  
   Examples: 5K, 10K, half marathon, marathon, FTP, swim pace, gym lifts.

4. **Injuries, pain, or limitations**  
   Any current injuries, recurring pain, or health limitations that affect training?

5. **Recovery and lifestyle**  
   Average sleep per night:  
   Stress level: low / medium / high  
   Job/activity level: mostly sitting / mixed / physical  
   Current fatigue level: low / medium / high  

6. **Equipment or access not visible from the data**  
   Anything important I should know?  
   Examples: HR strap, smart trainer, gym, pool, treadmill, road bike.

7. **Training platforms/apps**  
   Which training platforms do you currently have access to?  
   Examples: Rouvy, Zwift, MyWhoosh, TrainerRoad.
```

## Full Questionnaire If No Data Is Available

If no connected data/API is available, use this version:

```md
## Baseline Athlete Intake

Fill this in as best you can. Skip anything you do not know.

1. **Basic profile**  
   Age:  
   Sex / training category:  
   Height:  
   Weight:  

2. **Training background**  
   How long have you trained consistently?  
   Main sports or activities:  
   Average training hours per week:  

3. **Recent performance benchmarks**  
   List any recent PBs or strong efforts you know:  
   - 5K:  
   - 10K:  
   - Half marathon:  
   - Marathon:  
   - Cycling FTP / power test:  
   - Swim pace or distance:  
   - Other useful benchmark:  

4. **Current fitness metrics**  
   VO2max:  
   Resting HR:  
   Max HR:  
   Threshold HR / pace / power:  
   Device or app used for these metrics:  

5. **Current weekly training**  
   How many sessions per week do you currently do?  
   Rough split by sport or activity:  

6. **Injuries, pain, or limitations**  
   Any current injuries, recurring pain, or health limitations that affect training?  

7. **Recovery and lifestyle**  
   Average sleep per night:  
   Stress level: low / medium / high  
   Job/activity level: mostly sitting / mixed / physical  
   Current fatigue level: low / medium / high  

8. **Equipment and access**  
   What training equipment or access do you have?  
   Examples: GPS watch, HR strap, bike trainer, gym, pool, treadmill, road bike.  
   Which training platforms/apps do you use or have access to?  
   Examples: Rouvy, Zwift, MyWhoosh, TrainerRoad.
```

## Compact Version

If the user explicitly asks for a very short version, use this:

```md
## Quick Athlete Baseline

First, extract what is available from connected fitness data. Then ask only for missing fields:

1. Age, sex/training category, height, weight:
2. Main sports and how long you have trained consistently:
3. Average weekly training volume:
4. Recent PBs or benchmarks you know:
5. Current metrics, if available: VO2max, resting HR, max HR, threshold HR/pace/power:
6. Current injuries, recurring pain, or health limitations:
7. Equipment/access not visible from data: watch, HR strap, trainer, gym, pool, bike, treadmill:
8. Training platforms/apps available: Rouvy, Zwift, MyWhoosh, TrainerRoad, or similar:
```

## Follow-up Rules

After the user answers:
- Build a clean baseline profile.
- Summarize their profile in 5 to 8 bullets.
- Mark each uncertain field as missing, inferred, or confirmed.
- Identify missing but useful information.
- Do not ask more than 3 follow-up questions.
- Do not ask about race goals unless the user moves the conversation toward planning, goals, or events.
- If health or injury concerns appear important, suggest medical evaluation without diagnosing.

## Automatic Profile File Creation

When the interview has enough data to form a usable baseline, automatically create or update a user profile file in the repository.

Do this without asking for extra permission once the intake is complete enough.

### Minimum data required to create the file

Create the file when you have at least:

- age
- sex or training category
- height
- weight
- training background
- injuries/limitations status
- recovery/lifestyle basics
- training platform/app access

Benchmarks and fitness metrics can still be missing. Do not block file creation on those.

### File location rules

- Store profiles in `profiles/`
- If the user has a known name or handle, use `profiles/<slug>.md`
- If no name is known, use `profiles/athlete-profile.md`
- If the file already exists, update it instead of creating a duplicate

### File content format

Use this structure:

```md
# Athlete Profile

## Metadata

- Updated: [YYYY-MM-DD]
- Source: athlete baseline interview + connected activity data
- Status: usable baseline / partial baseline

## Basic Profile

- Name: [known / missing]
- Age: [value]
- Sex / training category: [value]
- Height: [value]
- Weight: [value]

## Training Background

- Main sports: [value]
- Experience: [value]
- Recent training pattern: [value]
- Recent weekly volume: [value]

## Benchmarks

- [known values or `missing`]

## Fitness Metrics

- Resting HR: [value / missing]
- Max HR: [value / missing]
- VO2max: [value / missing]
- FTP: [value / missing]
- Threshold HR / pace / power: [value / missing]

## Recovery And Lifestyle

- Sleep: [value]
- Stress: [value]
- Job/activity level: [value]
- Fatigue: [value]

## Injuries And Limitations

- [value]

## Equipment And Access

- Equipment: [value]
- Training platforms/apps: [value]

## Data Confidence

- Confirmed: [fields]
- Inferred: [fields]
- Missing: [fields]

## Notes

- [short notes that matter for future coaching or workout matching]
```

### Behavior after file creation

After creating or updating the file:

- tell the user which file was written
- keep the conversational summary short
- use the saved profile as the default baseline context for later commands such as workout finding or training advice

## Do Not Ask In This Intake

Avoid these during the baseline questionnaire:
- What race are you training for?
- What is your target race time?
- What is your running goal?
- What event date are you aiming for?
- What distance do you want to race?
- What is your A-race?
- What is your target pace?

Those belong in a later goal-specific intake, not in this baseline profile.

## Example Behavior

### If Strava/API data is available

```md
## What I could extract

- Main sports: running and cycling, inferred from recent activity history
- Recent weekly volume: about 6 to 8 hours/week, estimated from the last 8 weeks
- Benchmarks: estimated 5K best effort available from activity data
- Fitness metrics: max HR available, VO2max missing
- Injuries/limitations: not available from API

## Missing baseline info

1. Age, sex/training category, height, and weight?
2. How long have you trained consistently?
3. Any injuries, recurring pain, or health limitations that affect training?
4. Average sleep, stress level, and current fatigue level?
5. Any equipment not visible in the activity data, like HR strap, smart trainer, gym, or pool access?
6. Which training platforms/apps do you have access to, such as Rouvy, Zwift, MyWhoosh, or TrainerRoad?
```

### If no data is available

Use the full baseline questionnaire.
