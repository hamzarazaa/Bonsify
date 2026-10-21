import Image from "next/image";

const ICONS = {
  light: "/images/logos/icon-light.webp",
  dark: "/images/logos/icon-dark.webp",
};

export default function BrandMark({ className, variant = "light" }) {
  return (
    <Image
      className={className}
      src={ICONS[variant]}
      alt=""
      width={448}
      height={586}
      priority
    />
  );
}
