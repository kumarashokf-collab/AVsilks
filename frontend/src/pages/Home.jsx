import HeroSection from "../components/home/HeroSection";
import CategorySection from "../components/home/CategorySection";
import SectionHeader from "../components/ui/SectionHeader";
import ProductCard from "../components/ProductCard";
import SearchAI from "../components/SearchAI";
import { useProducts } from "../context/ProductContext";
import "./Home.css";

function Home() {
  const { products } = useProducts();

  return (
    <main className="home-page">
      <div className="home-search">
        <SearchAI />
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

          {products.length > 0 ? (
            <>
              <div className="home-products__grid">
                {products
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
              <h3>Products are being prepared</h3>
              <p>
                Our latest saree collection will appear here shortly.
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
