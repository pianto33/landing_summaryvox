import Image from "next/image";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import styles from "@/styles/Footer.module.css";
import logo from "../../../public/images/logo.png";

function Footer() {
  const { t } = useAppTranslation();

  return (
    <footer className={styles.footer}>
      <Image width={28} height={28} src={logo} alt="SummaryVox" />
      <div className={styles.footerLinks}>
        <span className={styles.company}>© {t("footer.company")}</span>
      </div>
    </footer>
  );
}

export default Footer;
