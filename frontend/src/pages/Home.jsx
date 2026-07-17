import { useMemo, useState } from "react";
import HeroSection from "../components/home/HeroSection";
import CategorySection from "../components/home/CategorySection";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "../components/ProductCard";
import SearchAI from "../components/SearchAI";
import { useProducts } from "../context/ProductContext";
import "./Home.css";

function Home() {
  const { products } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return products;
    }

    return products.filter((product) => {
      const searchableText = [
        product?.name,
        product?.category,
        product?.description,
        product?.sku,
        product?.color,
        product?.fabric
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [products, searchQuery]);

  return (
    <main className="home-page">
      <div className="home-search">
        <SearchAI onSearchChange={setSearchQuery} />
      </div>

      <section
        id="featured-products"
        className="section home-products home-products--first"
      >
        <div className="container">
          <SectionHeader
            eyebrow="Shop Now"
            title="Featured Sarees"
            description="మీకు నచ్చిన తాజా చీరలను వెంటనే చూడండి."
          />

          {filteredProducts.length > 0 ? (
            <>
              <div className="home-products__grid">
                {filteredProducts
                  .slice(0, 6)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                    />
                  ))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "24px"
                }}
              >
                <a
                  href="/products"
                  className="btn btn--primary"
                >
                  View All Products →
                </a>
              </div>
            </>
          ) : (
            <div className="home-products__empty card">
              <h3>{searchQuery ? "No matching sarees found" : "Products are being prepared"}</h3>
              <p>
                {searchQuery
                  ? `"${searchQuery}"కు సరిపోయే చీరలు లేవు.`
                  : "Our latest saree collection will appear here shortly."}
              </p>
            </div>
          )}
        </div>
      </section>

      <CategorySection />
      <HeroSection />
    </main>
  );
}

export default Home;
