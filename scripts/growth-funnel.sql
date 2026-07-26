-- Raltic acquisition and activation report.
-- No email, IP address, raw message, or other direct identifier is returned.

WITH
stage_order(stage, position) AS (
  VALUES
    ('landing_view', 1),
    ('cta_click', 2),
    ('signup_created', 3),
    ('email_verified', 4),
    ('workspace_opened', 5),
    ('workflow_room_opened', 6),
    ('workflow_starter_brief_sent', 7)
),
event_counts AS (
  SELECT
    event AS stage,
    COUNT(DISTINCT CASE
      WHEN occurred_at >= unixepoch('now', '-7 days') * 1000
      THEN COALESCE(user_id, journey_id)
    END) AS actors_7d,
    COUNT(DISTINCT CASE
      WHEN occurred_at >= unixepoch('now', '-30 days') * 1000
      THEN COALESCE(user_id, journey_id)
    END) AS actors_30d
  FROM marketing_events
  GROUP BY event
),
landing AS (
  SELECT
    MAX(CASE WHEN stage = 'landing_view' THEN actors_7d END) AS actors_7d,
    MAX(CASE WHEN stage = 'landing_view' THEN actors_30d END) AS actors_30d
  FROM event_counts
)
SELECT
  'funnel' AS report,
  stage_order.stage AS dimension,
  COALESCE(event_counts.actors_7d, 0) AS value_7d,
  COALESCE(event_counts.actors_30d, 0) AS value_30d,
  CASE
    WHEN landing.actors_7d > 0
    THEN ROUND(100.0 * COALESCE(event_counts.actors_7d, 0) / landing.actors_7d, 1)
    ELSE NULL
  END AS percent_of_landing_7d
FROM stage_order
LEFT JOIN event_counts ON event_counts.stage = stage_order.stage
CROSS JOIN landing
ORDER BY stage_order.position;

SELECT
  'acquisition_30d' AS report,
  COALESCE(NULLIF(utm_source, ''), '(direct or unknown)') AS dimension,
  COUNT(*) AS attributed_users,
  COUNT(DISTINCT utm_campaign) AS campaigns
FROM user_attributions
WHERE created_at >= unixepoch('now', '-30 days') * 1000
GROUP BY COALESCE(NULLIF(utm_source, ''), '(direct or unknown)')
ORDER BY attributed_users DESC, dimension ASC;

SELECT
  'product_30d' AS report,
  'new_verified_users' AS dimension,
  COUNT(*) AS value
FROM user
WHERE email_verified = 1
  AND created_at >= unixepoch('now', '-30 days') * 1000
UNION ALL
SELECT
  'product_30d',
  'users_with_completed_agent_run',
  COUNT(DISTINCT servers.owner_id)
FROM agent_runs
JOIN servers ON servers.id = agent_runs.server_id
WHERE agent_runs.status = 'completed'
  AND agent_runs.completed_at >= unixepoch('now', '-30 days') * 1000
UNION ALL
SELECT
  'product_30d',
  'users_active_on_2plus_days',
  COUNT(*)
FROM (
  SELECT sender_id
  FROM messages
  WHERE sender_type = 'human'
    AND created_at >= unixepoch('now', '-30 days') * 1000
    AND deleted_at IS NULL
  GROUP BY sender_id
  HAVING COUNT(DISTINCT date(created_at / 1000, 'unixepoch')) >= 2
);
