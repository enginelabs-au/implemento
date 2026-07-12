import type { CommunityProfile } from "../types/domain";

export const SEED_COMMUNITY_PROFILES: CommunityProfile[] = [
  {
    subreddit: "SaaS",
    tone: "Direct, founder-to-founder; problem-first validation",
    rulesNotes: "Avoid hard pitches; lead with pain or lessons learned",
    postPatterns: [
      "Problem-first validation threads",
      "What would you pay for X?",
      "Transparent build journey updates",
    ],
    promoPolicy: "Disclose affiliation; no unsolicited DMs",
  },
  {
    subreddit: "Entrepreneur",
    tone: "Story-led, broader founder audience",
    rulesNotes: "Share lessons and resources; minimize self-promotion",
    postPatterns: [
      "Lessons learned posts",
      "Resource drops",
      "Idea validation questions",
    ],
    promoPolicy: "Value-first; restrained product mentions",
  },
  {
    subreddit: "startups",
    tone: "YC-style directness; MVP and competitor comparisons",
    rulesNotes: "Be specific; show evidence; ask for feedback",
    postPatterns: [
      "MVP feedback requests",
      "Competitor comparison threads",
      "Early customer discovery",
    ],
    promoPolicy: "Feedback requests ok; avoid launch spam",
  },
  {
    subreddit: "sideproject",
    tone: "Show-and-tell; builders shipping small products",
    rulesNotes: "Demo with restraint; explain the pain you solved",
    postPatterns: [
      "I built X because Y hurt",
      "Show-and-tell with demo link",
      "Tech stack breakdowns",
    ],
    promoPolicy: "Demo links acceptable with context",
  },
  {
    subreddit: "indiehackers",
    tone: "Revenue transparency; niche problem focus",
    rulesNotes: "Anti-spam norms; share numbers when possible",
    postPatterns: [
      "Revenue milestones with lessons",
      "Niche problem discovery",
      "Tool/workflow shares",
    ],
    promoPolicy: "Transparent builds welcomed; no astroturfing",
  },
];
