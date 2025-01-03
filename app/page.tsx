import styles from "./page.module.css";
import GuitarTuner from "@/components/GuitarTuner";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <GuitarTuner />
      </main>
      <footer className={styles.footer}></footer>
    </div>
  );
}
