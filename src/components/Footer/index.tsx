import Image from "next/image";
import Link from "next/link";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import styles from "@/styles/Footer.module.css";
import logo from "../../../public/favicon.png";

const TERMS_URL = "https://voxpages.com/terms";

function Footer() {
  const { t } = useAppTranslation();

  return (
    <footer className={styles.footer}>
      <Image width={40} height={40} src={logo} alt="VoxPages" />
      <div className={styles.footerLinks}>
        <span className={styles.company}>© {t("footer.company")}</span>
        <Link
          href={TERMS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.termsLink}
        >
          {t("footer.terms_and_conditions")}
        </Link>
      </div>
    </footer>
  );
}

export default Footer;
