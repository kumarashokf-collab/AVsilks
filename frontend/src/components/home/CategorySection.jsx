import { STORE } from "../../constants/store";
import SectionHeader from "../ui/SectionHeader";
import "./CategorySection.css";

const CATEGORY_ICONS = {
  silk: "🪡",
  kanchipuram: "✨",
  dharmavaram: "🌺",
  cotton: "🌿",
  wedding: "💍",
  "new-arrivals": "🆕"
};

function CategorySection({ onSelectCategory }) {
  function handleCategoryClick(category) {
    if (typeof onSelectCategory === "function") {
      onSelectCategory(category);
    }

    document
      .getElementById("featured-products")
      ?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="section category-section">
      <div className="container">
        <SectionHeader
          eyebrow="Browse Collections"
          title="Shop by Category"
          description="Find the right saree for weddings, celebrations and everyday elegance."
          align="center"
        />

        <div className="category-section__grid">
          {STORE.categories.map((category) => (
            <button
              key={category.id}
              type="button"
              className="category-card"
              onClick={() => handleCategoryClick(category)}
            >
              <span
                className="category-card__icon"
                aria-hidden="true"
              >
                {CATEGORY_ICONS[category.id] || "🧵"}
              </span>

              <span className="category-card__content">
                <strong>{category.name}</strong>
                <small>{category.description}</small>
              </span>

              <span
                className="category-card__arrow"
                aria-hidden="true"
              >
                →
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategorySection;
