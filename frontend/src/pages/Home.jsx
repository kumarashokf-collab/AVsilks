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
      <HeroSection />
      <CategorySection />

      <section
        id="featured-products"
        className="section home-products"
      >
        <div className="container">
          <SectionHeader
            eyebrow="Our Collection"
            title="Featured Sarees"
            description="Explore handpicked sarees selected for celebrations, weddings and everyday elegance."
          />

          <div className="home-products__search">
            <SearchAI />
          </div>

          {products.length > 0 ? (
            <div className="home-products__grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
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
    </main>
  );
}

export default Home;
