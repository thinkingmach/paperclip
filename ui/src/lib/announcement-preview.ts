import animatedHero from "../../../announcements/examples/animated/assets/78bafb6adbfd9da899cdbb5d934b4c0b9df5d419d6f0a5104a87a7b25dcc6bd8.html?raw";
import type { Announcement } from "@thinkingmach/shared";

/** Design guide / Storybook only. Never a runtime feed fallback. */
export const announcementPreview: Announcement = {
  id: "preview-work-together",
  eyebrow: "New in ThinkingMach",
  title: "Give your next idea a team",
  description: "Bring agents, projects, and work together. Set the direction, then follow your team’s progress in ThinkingMach.",
  image: { path: `assets/${"0".repeat(64)}.png`, alt: "ThinkingMach — ideas become work" },
  secondaryLink: { kind: "external", label: "Learn more", url: "https://thinkingmach.com" },
  primaryAction: { kind: "route", label: "Explore your projects", path: "/projects" },
};

export const announcementAnimationPreview: Announcement = {
  ...announcementPreview,
  animation: { path: "assets/78bafb6adbfd9da899cdbb5d934b4c0b9df5d419d6f0a5104a87a7b25dcc6bd8.html", alt: "Agents plan, build and review work together." },
};
export const announcementAnimationPreviewSrc = `data:text/html;charset=utf-8,${encodeURIComponent(animatedHero)}`;
