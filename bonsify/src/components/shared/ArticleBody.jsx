import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import styles from "./ArticleBody.module.css";

const mdxComponents = {
  table: ({ children }) => (
    <div className={styles.tableWrap}>
      <table className={styles.table}>{children}</table>
    </div>
  ),
};

export default function ArticleBody({ source, checkmarks = false }) {
  return (
    <div className={`${styles.article} ${checkmarks ? styles.checkmarks : ""}`}>
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }}
      />
    </div>
  );
}
