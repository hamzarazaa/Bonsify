import { forwardRef } from "react";
import Image from "next/image";
import styles from "./PhoneMockup.module.css";

const PhoneMockup = forwardRef(function PhoneMockup(
  { src, alt = "", children, light = false, imgPosition = "top center" },
  ref
) {
  return (
    <div className={styles.stage}>
      <div
        className={`${styles.phone} ${light ? styles.light : ""}`}
        ref={ref}
      >
        <div className={styles.screen}>
          <div className={styles.notch} />
          {src && (
            <Image
              src={src}
              alt={alt}
              fill
              sizes="264px"
              style={{ objectFit: "cover", objectPosition: imgPosition }}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
});

export default PhoneMockup;
