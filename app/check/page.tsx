import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/seo/constants";
import { Wizard } from "@/components/wizard/Wizard";

const CHECK_TITLE = "Bereken je inflatie";
const CHECK_DESCRIPTION =
  "Upload één tot twaalf maanden Rabobank-afschriften en zie binnen twee minuten je persoonlijke inflatie per CBS-categorie.";

export const metadata: Metadata = {
  title: CHECK_TITLE,
  description: CHECK_DESCRIPTION,
  alternates: { canonical: "/check" },
  openGraph: {
    title: `${CHECK_TITLE} · ${SITE_NAME}`,
    description: CHECK_DESCRIPTION,
    url: "/check",
    siteName: SITE_NAME,
    locale: "nl_NL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${CHECK_TITLE} · ${SITE_NAME}`,
    description: CHECK_DESCRIPTION,
  },
};

export default function CheckPage() {
  return <Wizard />;
}
