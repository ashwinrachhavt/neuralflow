// Canonical task topics taxonomy used across classification/visualization/reporting
// Keep names stable; update docs when changing.
export const TASK_TOPICS = [
  'Planning & Strategy',
  'Product Management',
  'Coding & Development',
  'DevOps & Infra',
  'Bugfix & Debugging',
  'QA & Testing',
  'Design & UX',
  'Writing & Documentation',
  'Data & Analytics',
  'Research & Learning',
  'Communication & Meetings',
  'Customer Support',
  'Sales & Outreach',
  'Marketing & Growth',
  'Finance & Admin',
  'Legal & Compliance',
  'Operations & Maintenance',
  'Security & Privacy',
  'Personal & Wellness',
  'Home & Errands',
  'Career & Growth',
  'General',
] as const;

export type TaskTopic = typeof TASK_TOPICS[number];

