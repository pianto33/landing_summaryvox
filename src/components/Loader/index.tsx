import styles from "@/styles/Loader.module.css";

interface Props {
  size?: number;
  color?: "primary"| "secondary" | "white" | "gray" | "gold";
}

function Loader({ size = 100, color = "secondary" }: Props) {
  const borderColor = color === "gold" ? "#F7C948" : `var(--clr-${color})`;
  
  return (
    <span
      style={{
        width: size,
        height: size,
        margin: size / 10,
        borderColor,
      }}
      className={styles.loader}
    />
  );
}

export default Loader;
