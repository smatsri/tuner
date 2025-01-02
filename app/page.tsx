import Image from "next/image";
import styles from "./page.module.css";
import AudioVisualizer from "@/components/audio-visualizer";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AudioVisualizer />
      </main>
      <footer className={styles.footer}>
      </footer>
    </div>
  );
}
