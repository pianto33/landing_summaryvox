import Link from "next/link";
import { useRouter } from "next/router";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import styles from "@/styles/Terms.module.css";

const BackArrow = () => (
    <svg
        className={styles.backIcon}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

export default function Terms() {
    const router = useRouter();
    const { t } = useAppTranslation();
    const countryCode = router.query.countryCode?.toString() || "es";

    const sections = [
        { title: t("terms.section1_title"), text: t("terms.section1_text") },
        { title: t("terms.section2_title"), text: t("terms.section2_text") },
        {
            title: t("terms.section3_title"),
            intro: t("terms.section3_intro"),
            bullets: [
                t("terms.section3_basic"),
                t("terms.section3_premium"),
            ],
        },
        {
            title: t("terms.section4_title"),
            intro: t("terms.section4_intro"),
            subs: [
                { label: t("terms.section4_trial") },
                { label: t("terms.section4_cancel") },
                { label: t("terms.section4_renewal") },
                { label: t("terms.section4_effects") },
                { label: t("terms.section4_pricing") },
            ],
        },
        { title: t("terms.section5_title"), text: t("terms.section5_text") },
        { title: t("terms.section6_title"), text: t("terms.section6_text") },
        { title: t("terms.section7_title"), text: t("terms.section7_text") },
    ];

    return (
        <div className={styles.container}>
            <Link href={`/${countryCode}`} className={styles.backLink}>
                <BackArrow />
                {t("subscribe")}
            </Link>

            <h1 className={styles.title}>{t("terms.title")}</h1>

            {sections.map((section) => (
                <div key={section.title} className={styles.section}>
                    <h2 className={styles.sectionTitle}>{section.title}</h2>

                    {section.text && (
                        <p className={styles.sectionText}>{section.text}</p>
                    )}

                    {section.intro && (
                        <p className={styles.sectionText}>{section.intro}</p>
                    )}

                    {section.bullets && (
                        <ul className={styles.bulletList}>
                            {section.bullets.map((b) => (
                                <li key={b} className={styles.bulletItem}>
                                    {b}
                                </li>
                            ))}
                        </ul>
                    )}

                    {section.subs && (
                        <ul className={styles.subList}>
                            {section.subs.map((sub) => (
                                <li key={sub.label} className={styles.subItem}>
                                    {sub.label}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            ))}
        </div>
    );
}
