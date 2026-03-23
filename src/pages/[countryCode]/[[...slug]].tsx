import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import StripeExpressCheckout from "@/components/StripeExpressCheckout";
import Header from "@/components/Header";
import styles from "@/styles/Home.module.css";
import { useStripeData } from "@/hooks/useStripeData";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import Footer from "@/components/Footer";
import { clientLogger } from "@/utils/clientLogger";

const TERMS_URL = "https://summaryvox.com/terms";

const CircleStep = ({ step, bg }: { step: number; bg: string }) => (
    <div className={styles.circleStep} style={{ backgroundColor: bg }}>
        {step}
    </div>
);

export default function Home() {
    const router = useRouter();
    const { t } = useAppTranslation();
    const { amount, currency } = useStripeData();
    const benefits = t("benefits_list", { returnObjects: true }) as string[];
    const formattedAmount = (amount / 100).toFixed(2);

    // Trackear visitas a la página (no bloqueante)
    useEffect(() => {
        if (router.isReady) {
            const countryCode = router.query.countryCode?.toString() || 'unknown';
            clientLogger.visit('Landing Page', {
                countryCode,
                path: router.asPath,
                locale: router.locale,
            });
        }
    }, [router.isReady, router.query.countryCode, router.asPath, router.locale]);

    return (
        <div className={styles.snapContainer}>
            <div className={styles.welcomeContainer}>
                <Header />
                <div className={styles.contentWrapper}>
                    <p
                        className={styles.welcomeIntro}
                        dangerouslySetInnerHTML={{ __html: t("welcome_intro") }}
                    />
                    <div className={styles.onlineActivationContainer}>
                        <h2 className={styles.onlineActivation}>
                            {t("online_activation")}
                        </h2>
                        <StripeExpressCheckout
                            label={t("subscribe")}
                            amount={amount}
                            currency={currency}
                            animateButton
                        />
                        <p className={styles.trialInfo}>
                            {t("enjoy_free_trial", { amount: formattedAmount, currency: currency.toUpperCase() })}
                        </p>
                        <Link
                            href={TERMS_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.termsBelowTrial}
                        >
                            {t("footer.terms_and_conditions")}
                        </Link>
                        {/* Steps Indicator */}
                        <div className={styles.stepsContainer}>
                            <div className={styles.stepsWrapper}>
                                <h2 className={styles.stepsTitle}>
                                    {t("accessIn3Steps")}
                                </h2>
                                <div className={styles.stepsGrid}>
                                    {[t("step1"), t("step2"), t("step3")].map(
                                        (step, i) => (
                                            <div
                                                key={step}
                                                className={styles.stepItem}
                                            >
                                                <CircleStep
                                                    step={i + 1}
                                                    bg={
                                                        i === 2
                                                            ? "#D1D5DB"
                                                            : "#F7C948"
                                                    }
                                                />
                                                <p
                                                    className={styles.stepText}
                                                    style={{
                                                        color:
                                                            i === 2
                                                                ? "#9CA3AF"
                                                                : "#3A3A3A",
                                                    }}
                                                >
                                                    {step}
                                                </p>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div></div>
            </div>
            
            <div className={styles.benefitsContainer}>
                <section className={styles.benefits}>
                    <h2>{t("benefits_premium")}</h2>
                    <ul>
                        {benefits.map((item, i) => (
                            <React.Fragment key={item}>
                                <li>{item}</li>
                                {i !== benefits.length - 1 && <hr />}
                            </React.Fragment>
                        ))}
                    </ul>
                </section>
                <Footer />
            </div>
        </div>
    );
}
