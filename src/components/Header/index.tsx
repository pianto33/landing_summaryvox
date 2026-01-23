import Image from "next/image";
import secure from "../../../public/images/secure-dark.png";
import premium from "../../../public/images/premium-dark.png";
import multiDevices from "../../../public/images/multi-devices-dark.png";
import styles from "@/styles/Header.module.css";

function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <div className={styles.imageWrapper}>
                    <Image
                        src={secure}
                        alt="Secure"
                        fill
                        sizes="(max-width: 768px) 33vw, 200px"
                        style={{ objectFit: "contain" }}
                        priority
                    />
                </div>
                <div className={styles.imageWrapper}>
                    <Image
                        src={premium}
                        alt="Premium"
                        fill
                        sizes="(max-width: 768px) 33vw, 200px"
                        style={{ objectFit: "contain" }}
                        priority
                    />
                </div>
                <div className={styles.imageWrapper}>
                    <Image
                        src={multiDevices}
                        alt="Multi-Device"
                        fill
                        sizes="(max-width: 768px) 33vw, 200px"
                        style={{ objectFit: "contain" }}
                        priority
                    />
                </div>
            </div>
        </header>
    );
}

export default Header;
