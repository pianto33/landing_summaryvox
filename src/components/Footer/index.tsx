import Image from "next/image";
import { useAppTranslation } from "@/hooks/useAppTranslation";
import styles from "@/styles/Footer.module.css";
import logo from "../../../public/favicon.png";

function Footer() {
  const { t } = useAppTranslation();

  return (
    <footer className={styles.footer}>
      <Image width={40} height={40} src={logo} alt="summaryvox" />
      <div className={styles.footerLinks}>
        <span className={styles.company}>© {t("footer.company")}</span>
      </div>
    </footer>
  );
}

export default Footer;
