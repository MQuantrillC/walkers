import Link from "next/link";
import { Procession } from "@/components/Procession";
import { SAMPLE_WALKERS } from "@/walker/samples";
import styles from "./home.module.css";

// Placeholder for The Walk: the real gallery of published walkers arrives
// with persistence (Stage 3) and the full procession (Stage 4).
export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.intro}>
        <h1>Create a person. Make them your own. Watch them walk.</h1>
        <Link href="/create" className={styles.cta}>
          Create your walker
        </Link>
      </div>
      <Procession walkers={SAMPLE_WALKERS} height={170} />
    </div>
  );
}
