import styles from "@/styles/Title.module.css";

interface Props {
  children: React.ReactNode;
}

function Title({ children }: Props) {
  return <h1 className={styles.title}>{children}</h1>;
}

export default Title;
