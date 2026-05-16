import Image from "next/image";
import Link from "next/link";

const Logo = ({
  className = "text-xl",
  href = "/",
}: {
  className?: string;
  href?: string;
}) => {
  return (
    <Link
      href={href}
      className={`${className} font-bold tracking-tighter text-foreground flex items-center gap-2`}
    >
      <Image
        src="https://res.cloudinary.com/dp9aciyww/image/upload/v1758662697/logo_ndetpj.png"
        alt="EduBooster"
        width={130}
        height={80}
        priority
      />
    </Link>
  );
};

export default Logo;
