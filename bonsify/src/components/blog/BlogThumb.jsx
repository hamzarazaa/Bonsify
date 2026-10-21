import Image from "next/image";
import BlogCover from "@/components/blog/BlogCover";
import styles from "./BlogCover.module.css";

// Cards use a real photo when the post defines one (entry.heroImage),
// otherwise fall back to the generated per-topic cover art so every card
// still gets a distinct image.
export default function BlogThumb({ entry, size = "md" }) {
  if (entry.heroImage?.src) {
    return (
      <div className={`${styles.cover} ${styles[size]}`}>
        <Image
          src={entry.heroImage.src}
          alt={entry.heroImage.alt || entry.title}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 900px) 50vw, 33vw"
          style={{ objectFit: "cover", objectPosition: "center" }}
        />
      </div>
    );
  }

  return <BlogCover topicKey={entry.topicKey} size={size} />;
}
