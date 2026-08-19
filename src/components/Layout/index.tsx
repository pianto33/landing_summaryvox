import Head from "next/head";
import { Inter, Orbitron } from "next/font/google";
import styles from "@/styles/Layout.module.css";
import { useAppTranslation } from "@/hooks/useAppTranslation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

interface Props {
  children: React.ReactNode;
}

function Layout({ children }: Props) {
  const { t } = useAppTranslation();

  return (
    <>
      <Head>
        <meta name="description" content={t("metadata.description")} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </Head>

      <div
        className={`${styles.layout} ${inter.variable} ${orbitron.variable}`}
      >
        <main>{children}</main>
      </div>
    </>
  );
}

export default Layout;
