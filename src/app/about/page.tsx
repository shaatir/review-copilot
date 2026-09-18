import { AboutView } from "@/components/AboutView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
};

export default function AboutPage() {
  return <AboutView />;
}
