function SectionHeader({
  eyebrow,
  title,
  description,
  align = "left"
}) {
  return (
    <header
      className="section__header"
      style={{
        textAlign: align
      }}
    >
      {eyebrow ? (
        <p className="section__eyebrow">
          {eyebrow}
        </p>
      ) : null}

      <h2 className="section__title">
        {title}
      </h2>

      {description ? (
        <p
          className="section__description"
          style={{
            marginInline:
              align === "center" ? "auto" : undefined
          }}
        >
          {description}
        </p>
      ) : null}
    </header>
  );
}

export default SectionHeader;
