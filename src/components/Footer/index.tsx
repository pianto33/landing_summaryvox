import Image from "next/image";
import styles from "@/styles/Footer.module.css";
import logo from "../../../public/favicon.png";

function Footer() {
  return (
    <footer className={styles.footer}>
      <Image width={30} height={40} src={logo} alt="VoxPages" />
    </footer>
  );
}

export default Footer;
